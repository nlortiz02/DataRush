"use client";

import React, { useEffect, useMemo, useState } from "react";
import Header from "../../components/Header";
import { useSessionGuard } from "../hooks/useSessionGuard";
import styles from "./page.module.css";

type Ticket = {
	id: number;
	title: string;
	description: string;
	priority: "baja" | "media" | "alta" | "critica";
	status: "pendiente" | "aprobado" | "en_progreso" | "resuelto";
	created_by: string;
	assigned_to: string | null;
	solution_text: string | null;
	resolved_by: string | null;
	user_image_url: string | null;
	solution_image_url: string | null;
	created_at: string;
	updated_at: string;
	resolved_at: string | null;
};

const PRIORITY_OPTIONS: Ticket["priority"][] = ["baja", "media", "alta", "critica"];
const STATUS_OPTIONS: Ticket["status"][] = [
	"pendiente",
	"aprobado",
	"en_progreso",
	"resuelto",
];

export default function TicketsPage() {
	useSessionGuard();

	const [tickets, setTickets] = useState<Ticket[]>([]);
	const [role, setRole] = useState<string>("");
	const [username, setUsername] = useState<string>("");
	const [isLoading, setIsLoading] = useState<boolean>(true);
	const [error, setError] = useState<string>("");

	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const [priority, setPriority] = useState<Ticket["priority"]>("media");
	const [statusFilter, setStatusFilter] = useState<"all" | Ticket["status"]>("all");
	const [newImageFile, setNewImageFile] = useState<File | null>(null);
	const [filterText, setFilterText] = useState("");
	const [filterUser, setFilterUser] = useState("");
	const [filterPriority, setFilterPriority] = useState<"all" | Ticket["priority"]>(
		"all"
	);
	const [filterId, setFilterId] = useState("");
	const [showCreatePanel, setShowCreatePanel] = useState(true);
	const [showScrollTop, setShowScrollTop] = useState(false);

	const [solutionDrafts, setSolutionDrafts] = useState<Record<number, string>>({});
	const [solutionImages, setSolutionImages] = useState<Record<number, File | null>>({});
	const [actionBusy, setActionBusy] = useState<Record<number, boolean>>({});

	const canCreate = role === "admin" || role === "usuario";
	const isAdmin = role === "admin";
	const isIT = role === "it";

	const filteredTickets = useMemo(() => {
		return tickets.filter((ticket) => {
			if (statusFilter !== "all" && ticket.status !== statusFilter) return false;
			if (filterPriority !== "all" && ticket.priority !== filterPriority) return false;
			if (filterUser.trim()) {
				const userQuery = filterUser.trim().toLowerCase();
				if (!ticket.created_by.toLowerCase().includes(userQuery)) return false;
			}
			if (filterId.trim()) {
				const idValue = Number(filterId.trim());
				if (!idValue || ticket.id !== idValue) return false;
			}
			if (filterText.trim()) {
				const textQuery = filterText.trim().toLowerCase();
				const haystack =
					`${ticket.title} ${ticket.description} ${ticket.solution_text || ""}`.toLowerCase();
				if (!haystack.includes(textQuery)) return false;
			}
			return true;
		});
	}, [
		tickets,
		statusFilter,
		filterPriority,
		filterUser,
		filterId,
		filterText,
	]);

	const loadTickets = async () => {
		setIsLoading(true);
		setError("");

		try {
			const response = await fetch("/api/tickets");
			const data = await response.json();

			if (!response.ok) {
				throw new Error(data?.message || "No se pudieron cargar los tickets");
			}

			setTickets(data.tickets || []);
			setRole(data.role || "");
			setUsername(data.username || "");
		} catch (err: any) {
			setError(err?.message || "Error de conexion");
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		loadTickets();
	}, []);

	useEffect(() => {
		const handleScroll = () => {
			setShowScrollTop(window.scrollY > 320);
		};

		handleScroll();
		window.addEventListener("scroll", handleScroll);
		return () => window.removeEventListener("scroll", handleScroll);
	}, []);

	const handleScrollTop = () => {
		window.scrollTo({ top: 0, behavior: "smooth" });
	};

	const handleCreate = async () => {
		setError("");
		if (!title.trim() || !description.trim()) {
			setError("Titulo y descripcion son requeridos");
			return;
		}

		try {
			const formData = new FormData();
			formData.append("title", title);
			formData.append("description", description);
			formData.append("priority", priority);
			if (newImageFile) {
				formData.append("image", newImageFile);
			}

			const response = await fetch("/api/tickets", {
				method: "POST",
				body: formData,
			});
			const data = await response.json();
			if (!response.ok) {
				throw new Error(data?.message || "No se pudo crear el ticket");
			}

			setTitle("");
			setDescription("");
			setPriority("media");
			setNewImageFile(null);
			await loadTickets();
		} catch (err: any) {
			setError(err?.message || "Error de conexion");
		}
	};

	const handleUpdate = async (ticketId: number, payload: Record<string, any>) => {
		setActionBusy((prev) => ({ ...prev, [ticketId]: true }));
		setError("");

		try {
			const response = await fetch(`/api/tickets/${ticketId}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
			});
			const data = await response.json();
			if (!response.ok) {
				throw new Error(data?.message || "No se pudo actualizar el ticket");
			}

			await loadTickets();
		} catch (err: any) {
			setError(err?.message || "Error de conexion");
		} finally {
			setActionBusy((prev) => ({ ...prev, [ticketId]: false }));
		}
	};

	const handleUpdateFormData = async (ticketId: number, formData: FormData) => {
		setActionBusy((prev) => ({ ...prev, [ticketId]: true }));
		setError("");

		try {
			const response = await fetch(`/api/tickets/${ticketId}`, {
				method: "PATCH",
				body: formData,
			});
			const data = await response.json();
			if (!response.ok) {
				throw new Error(data?.message || "No se pudo actualizar el ticket");
			}

			await loadTickets();
		} catch (err: any) {
			setError(err?.message || "Error de conexion");
		} finally {
			setActionBusy((prev) => ({ ...prev, [ticketId]: false }));
		}
	};

	const handleDelete = async (ticketId: number) => {
		setActionBusy((prev) => ({ ...prev, [ticketId]: true }));
		setError("");

		try {
			const response = await fetch(`/api/tickets/${ticketId}`, {
				method: "DELETE",
			});
			const data = await response.json();
			if (!response.ok) {
				throw new Error(data?.message || "No se pudo eliminar el ticket");
			}

			await loadTickets();
		} catch (err: any) {
			setError(err?.message || "Error de conexion");
		} finally {
			setActionBusy((prev) => ({ ...prev, [ticketId]: false }));
		}
	};

	return (
		<div className={styles.container}>
			<Header />

			<main className={styles.mainContent}>
				<section className={styles.pageHeader}>
					<div>
						<h1 className={styles.title}>Centro de Tickets</h1>
						<p className={styles.subtitle}>
							Gestiona solicitudes y soporte IT desde un solo lugar
						</p>
					</div>
					<div className={styles.metaCard}>
						<div className={styles.metaRow}>
							<span className={styles.metaLabel}>Usuario</span>
							<span className={styles.metaValue}>{username || "-"}</span>
						</div>
						<div className={styles.metaRow}>
							<span className={styles.metaLabel}>Rol</span>
							<span className={styles.metaValue}>{role || "-"}</span>
						</div>
						{isAdmin && (
							<button
								className={styles.ghostBtn}
								onClick={() => setShowCreatePanel((prev) => !prev)}
							>
								{showCreatePanel ? "Ocultar creador" : "Mostrar creador"}
							</button>
						)}
					</div>
				</section>

				{error && <div className={styles.errorBanner}>{error}</div>}

				<section
					className={`${styles.grid} ${!showCreatePanel ? styles.gridCollapsed : ""}`}
				>
					<div
						className={`${styles.panel} ${styles.panelSticky} ${
							!showCreatePanel ? styles.panelHidden : ""
						}`}
					>
						<div className={styles.panelHeaderRow}>
							<h2 className={styles.panelTitle}>Nuevo ticket</h2>
						</div>
						{canCreate ? (
							<div
								className={`${styles.form} ${
									!showCreatePanel ? styles.formCollapsed : ""
								}`}
							>
								<label className={styles.label}>
									Titulo
									<input
										className={styles.input}
										value={title}
										onChange={(e) => setTitle(e.target.value)}
										placeholder="Ej: Acceso bloqueado"
									/>
								</label>
								<label className={styles.label}>
									Descripcion
									<textarea
										className={styles.textarea}
										value={description}
										onChange={(e) => setDescription(e.target.value)}
										placeholder="Describe el problema"
										rows={4}
									/>
								</label>
								<label className={styles.label}>
									Prioridad
									<select
										className={styles.select}
										value={priority}
										onChange={(e) => setPriority(e.target.value as Ticket["priority"])}
									>
										{PRIORITY_OPTIONS.map((option) => (
											<option key={option} value={option}>
												{option}
											</option>
										))}
									</select>
								</label>
								<label className={styles.label}>
									Imagen del ticket
									<input
										className={styles.fileInput}
										type="file"
										accept="image/*"
										onChange={(e) =>
											setNewImageFile(e.target.files?.[0] || null)
										}
									/>
								</label>
								<button className={styles.primaryBtn} onClick={handleCreate}>
									Crear ticket
								</button>
							</div>
						) : (
							<div className={styles.infoBox}>
								Este rol no tiene permisos para crear tickets.
							</div>
						)}
					</div>

					<div className={styles.panelWide}>
						<div className={styles.panelHeader}>
							<h2 className={styles.panelTitle}>Tickets activos</h2>
							<div className={styles.filterRow}>
								<span className={styles.filterLabel}>Estado</span>
								<select
									className={styles.select}
									value={statusFilter}
									onChange={(e) => setStatusFilter(e.target.value as "all" | Ticket["status"])}
								>
									<option value="all">todos</option>
									{STATUS_OPTIONS.map((option) => (
										<option key={option} value={option}>
											{option}
										</option>
									))}
								</select>
							</div>
						</div>
						<div className={styles.filterGrid}>
							<label className={styles.filterField}>
								Texto
								<input
									className={styles.input}
									placeholder="Buscar en titulo o descripcion"
									value={filterText}
									onChange={(e) => setFilterText(e.target.value)}
								/>
							</label>
							<label className={styles.filterField}>
								Usuario
								<input
									className={styles.input}
									placeholder="Ej: copoxx"
									value={filterUser}
									onChange={(e) => setFilterUser(e.target.value)}
								/>
							</label>
							<label className={styles.filterField}>
								ID
								<input
									className={styles.input}
									placeholder="#"
									value={filterId}
									onChange={(e) => setFilterId(e.target.value)}
								/>
							</label>
							<label className={styles.filterField}>
								Prioridad
								<select
									className={styles.select}
									value={filterPriority}
									onChange={(e) =>
										setFilterPriority(e.target.value as "all" | Ticket["priority"])
									}
								>
									<option value="all">todas</option>
									{PRIORITY_OPTIONS.map((option) => (
										<option key={option} value={option}>
											{option}
										</option>
									))}
								</select>
							</label>
						</div>

						{isLoading ? (
							<div className={styles.infoBox}>Cargando tickets...</div>
						) : filteredTickets.length === 0 ? (
							<div className={styles.infoBox}>No hay tickets para mostrar.</div>
						) : (
							<div className={styles.ticketList}>
								{filteredTickets.map((ticket) => (
									<article key={ticket.id} className={styles.ticketCard}>
										<header className={styles.ticketHeader}>
											<div>
												<h3 className={styles.ticketTitle}>{ticket.title}</h3>
												<p className={styles.ticketMeta}>
													#{ticket.id} - {ticket.created_by}
												</p>
											</div>
											<div className={styles.badges}>
												<span className={`${styles.badge} ${styles[`status_${ticket.status}`]}`}>
													{ticket.status}
												</span>
												<span className={`${styles.badge} ${styles[`priority_${ticket.priority}`]}`}>
													{ticket.priority}
												</span>
											</div>
										</header>
										<p className={styles.ticketDescription}>{ticket.description}</p>

										{ticket.user_image_url && (
											<div className={styles.imageBox}>
												<span className={styles.imageLabel}>Imagen del usuario</span>
												<img
													className={styles.ticketImage}
													src={ticket.user_image_url}
													alt="Imagen del ticket"
												/>
											</div>
										)}

										<div className={styles.ticketInfo}>
											<span>Creado: {new Date(ticket.created_at).toLocaleString()}</span>
											{ticket.resolved_at && (
												<span>Resuelto: {new Date(ticket.resolved_at).toLocaleString()}</span>
											)}
										</div>

										{ticket.solution_text && (
											<div className={styles.solutionBox}>
												<strong>Solucion IT</strong>
												<p>{ticket.solution_text}</p>
												{ticket.resolved_by && (
													<span className={styles.solutionMeta}>Por: {ticket.resolved_by}</span>
												)}
											</div>
										)}

										{ticket.solution_image_url && (
											<div className={styles.imageBox}>
												<span className={styles.imageLabel}>Imagen de solucion</span>
												<img
													className={styles.ticketImage}
													src={ticket.solution_image_url}
													alt="Imagen de solucion"
												/>
											</div>
										)}

										<div className={styles.actions}>
											{isAdmin && (
												<>
													<label className={styles.actionLabel}>
														Estado
														<select
															className={styles.selectSmall}
															value={ticket.status}
															onChange={(e) =>
																handleUpdate(ticket.id, { status: e.target.value })
															}
															disabled={!!actionBusy[ticket.id]}
														>
															{STATUS_OPTIONS.map((option) => (
																<option key={option} value={option}>
																	{option}
																</option>
															))}
														</select>
													</label>
													<label className={styles.actionLabel}>
														Prioridad
														<select
															className={styles.selectSmall}
															value={ticket.priority}
															onChange={(e) =>
																handleUpdate(ticket.id, { priority: e.target.value })
															}
															disabled={!!actionBusy[ticket.id]}
														>
															{PRIORITY_OPTIONS.map((option) => (
																<option key={option} value={option}>
																	{option}
																</option>
															))}
														</select>
													</label>
													<button
														className={styles.dangerBtn}
														onClick={() => handleDelete(ticket.id)}
														disabled={!!actionBusy[ticket.id]}
													>
														Eliminar
													</button>
												</>
											)}

											{isIT && (
												<>
													<button
														className={styles.secondaryBtn}
														onClick={() => handleUpdate(ticket.id, { status: "en_progreso" })}
														disabled={!!actionBusy[ticket.id]}
													>
														Marcar en progreso
													</button>
													<div className={styles.solutionInput}>
														<textarea
															className={styles.textarea}
															rows={3}
															placeholder="Solucion aplicada"
															value={solutionDrafts[ticket.id] || ""}
															onChange={(e) =>
																setSolutionDrafts((prev) => ({
																	...prev,
																	[ticket.id]: e.target.value,
																}))
															}
														/>
														<input
															className={styles.fileInput}
															type="file"
															accept="image/*"
															onChange={(e) =>
																setSolutionImages((prev) => ({
																	...prev,
																	[ticket.id]: e.target.files?.[0] || null,
																}))
															}
														/>
														<button
															className={styles.primaryBtn}
															onClick={() => {
																const formData = new FormData();
																formData.append("status", "resuelto");
																formData.append(
																	"solution_text",
																	solutionDrafts[ticket.id] || ""
																);
																const imageFile = solutionImages[ticket.id];
																if (imageFile) {
																	formData.append("solution_image", imageFile);
																}
																handleUpdateFormData(ticket.id, formData);
															}}
															disabled={!!actionBusy[ticket.id]}
														>
															Guardar solucion
														</button>
													</div>
												</>
											)}
										</div>
									</article>
								))}
							</div>
						)}
					</div>
				</section>
			</main>

				<button
					className={`${styles.scrollTopBtn} ${
						showScrollTop ? styles.scrollTopVisible : ""
					}`}
					onClick={handleScrollTop}
					title="Volver arriba"
					type="button"
				>
					↑
				</button>
		</div>
	);
}
