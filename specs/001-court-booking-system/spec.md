# Feature Specification: Sistema de Reservas de Canchas de Pádel

**Feature Branch**: `001-court-booking-system`

**Created**: 2026-09-13

**Status**: Draft

**Input**: User description: "Sistema de reservas de canchas de pádel con autenticación de usuarios, exploración/selección de 5 canchas fijas con grilla de disponibilidad de 24 horas, creación de reservas con prevención de colisiones, y un panel de gestión de reservas propias (futuras/pasadas, con cancelación)."

## Clarifications

### Session 2026-09-13

- Q: ¿En qué momento una reserva deja de considerarse "futura/activa" y pasa a ser "pasada": cuando llega su hora de inicio, o cuando llega su hora de fin? → A: Al terminar (hora de fin). Mientras la reserva está en curso sigue contando como "futura/vigente": bloquea nuevas reservas del mismo usuario, aparece en "futuras" y es cancelable hasta que termine.
- Q: ¿El spec debe exigir explícitamente que las contraseñas se almacenen con hashing seguro (nunca en texto plano)? → A: Sí, requisito explícito.
- Q: ¿Qué requisito mínimo de contraseña debe exigir el registro (FR-001)? → A: Mínimo 8 caracteres, sin más reglas.
- Q: ¿La sesión de un usuario autenticado debe expirar automáticamente tras un tiempo, o permanecer activa indefinidamente hasta cerrar sesión manualmente? → A: Expira tras 24 horas de inactividad.
- Q: ¿El registro de usuario requiere verificar el correo electrónico (enlace/código de confirmación) antes de activar la cuenta? → A: Sin verificación de correo; la cuenta queda activa de inmediato.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Registro e inicio de sesión (Priority: P1)

Un jugador de pádel crea una cuenta con su correo electrónico y contraseña, e inicia sesión para acceder a las funciones de reserva del club. Sin una sesión activa, solo puede ver que el sistema existe, pero no puede ver la disponibilidad real ni reservar.

**Why this priority**: Es el prerrequisito absoluto de todo el sistema: ninguna otra funcionalidad (ver disponibilidad, reservar, gestionar reservas) puede exponerse sin identificar de forma segura a quién pertenece cada reserva.

**Independent Test**: Puede probarse de forma aislada registrando una cuenta nueva, cerrando sesión, iniciando sesión de nuevo con esas credenciales, y verificando que un usuario sin sesión activa es bloqueado al intentar acceder a la disponibilidad o a una reserva.

**Acceptance Scenarios**:

1. **Given** un visitante sin cuenta, **When** se registra con un correo electrónico válido no usado antes y una contraseña, **Then** la cuenta se crea y el usuario queda con una sesión activa.
2. **Given** un usuario registrado, **When** inicia sesión con su correo y contraseña correctos, **Then** obtiene una sesión activa y accede a las funciones de reserva.
3. **Given** un usuario registrado, **When** intenta iniciar sesión con una contraseña incorrecta, **Then** el sistema rechaza el intento con un mensaje de error claro y no crea sesión.
4. **Given** un visitante sin sesión activa, **When** intenta ver la disponibilidad completa de una cancha o crear una reserva, **Then** el sistema le impide la acción y le solicita iniciar sesión.
5. **Given** un intento de registro, **When** el correo electrónico ya está registrado, **Then** el sistema rechaza el registro con un mensaje de error claro.

---

### User Story 2 - Explorar disponibilidad y crear una reserva (Priority: P2)

Un jugador con sesión activa elige una de las 5 canchas del club y una fecha en un calendario, ve la grilla de 24 bloques horarios de una hora indicando cuáles están disponibles y cuáles reservados, selecciona un bloque disponible y confirma la reserva.

**Why this priority**: Es el valor central del producto: sin la capacidad de ver disponibilidad real y reservar un turno, el sistema no cumple su propósito, aunque ya existan cuentas de usuario.

**Independent Test**: Con un usuario autenticado, puede probarse de forma aislada seleccionando una cancha, una fecha futura y un bloque horario disponible, confirmando la reserva, y verificando que ese bloque pasa a mostrarse como "Reservado" para esa cancha y fecha.

**Acceptance Scenarios**:

1. **Given** un usuario con sesión activa, **When** selecciona una de las 5 canchas y una fecha, **Then** ve la grilla de 24 bloques de una hora para esa cancha y fecha, cada uno marcado como "Disponible" o "Reservado".
2. **Given** un bloque marcado como "Disponible", **When** el usuario lo selecciona y confirma la reserva, **Then** el sistema crea la reserva y el bloque pasa a mostrarse como "Reservado" para todos los usuarios.
3. **Given** un usuario que ya tiene una reserva activa, **When** intenta confirmar una nueva reserva, **Then** el sistema rechaza la acción con un mensaje explicando que ya tiene una reserva activa.
4. **Given** dos usuarios con sesión activa que ven el mismo bloque como "Disponible" al mismo tiempo, **When** ambos intentan confirmar una reserva sobre ese mismo bloque casi simultáneamente, **Then** solo la primera confirmación exitosa crea la reserva y la segunda es rechazada con un mensaje claro indicando que el horario ya no está disponible.
5. **Given** una fecha u hora que ya transcurrió, **When** el usuario intenta seleccionarla para reservar, **Then** el sistema no permite la reserva sobre ese bloque pasado.
6. **Given** un usuario con sesión activa, **When** intenta reservar un rango que no corresponde a un bloque completo de una hora, **Then** el sistema no ofrece esa opción (solo se pueden seleccionar bloques completos predefinidos).

---

### User Story 3 - Gestionar mis reservas (Priority: P3)

Un jugador con sesión activa consulta un panel con sus reservas futuras y su historial de reservas pasadas, y puede cancelar una reserva futura desde ese panel.

**Why this priority**: Aporta valor de autoservicio y confianza (el usuario puede verificar y corregir sus propios compromisos) pero depende de que ya existan reservas creadas mediante la funcionalidad anterior.

**Independent Test**: Con un usuario autenticado que ya tiene al menos una reserva futura, puede probarse de forma aislada abriendo el panel "Mis reservas", verificando que la reserva aparece con cancha, fecha y hora, cancelándola, y confirmando que el bloque vuelve a mostrarse como "Disponible" en la grilla.

**Acceptance Scenarios**:

1. **Given** un usuario con sesión activa que tiene reservas, **When** abre su panel de reservas, **Then** ve separadas sus reservas futuras y su historial de reservas pasadas, cada una con nombre de la cancha, fecha y hora.
2. **Given** una reserva futura en el panel, **When** el usuario elige cancelarla y confirma la acción, **Then** la reserva se cancela, deja de aparecer como reserva futura activa, y el bloque horario correspondiente vuelve a estar "Disponible".
3. **Given** una reserva pasada en el historial, **When** el usuario la visualiza, **Then** el sistema no ofrece la opción de cancelarla.
4. **Given** un usuario intenta cancelar una reserva, **When** el usuario no confirma la acción (se arrepiente), **Then** la reserva permanece activa sin cambios.
5. **Given** un usuario con sesión activa, **When** consulta su panel, **Then** solo ve sus propias reservas, nunca las de otros usuarios.
6. **Given** una reserva cancelada en el historial, **When** el usuario la visualiza, **Then** el sistema no ofrece ninguna accion para ejecutar.

### Edge Cases

- ¿Qué sucede si un usuario intenta cancelar una reserva que ya pasó (por error de interfaz o solicitud directa)? El sistema debe rechazarlo: solo las reservas futuras son cancelables.
- ¿Qué sucede si un usuario intenta gestionar (ver detalle o cancelar) una reserva que pertenece a otro usuario? El sistema debe rechazar la acción, sin importar cómo se solicite.
- ¿Qué sucede si dos solicitudes de reserva llegan casi al mismo tiempo para el mismo bloque? Solo una debe tener éxito; la otra recibe un rechazo claro (ver US2, escenario 4).
- ¿Qué sucede si el usuario selecciona una fecha sin ninguna reserva previa para esa cancha? Todos los 24 bloques se muestran como "Disponibles" (salvo los que ya transcurrieron si la fecha es hoy).
- ¿Qué sucede si el usuario recarga la página mientras tiene una reserva activa? La grilla y el panel de reservas deben reflejar el estado real y actual almacenado en el sistema, no un estado local desactualizado.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema MUST permitir a un visitante registrarse con correo electrónico y contraseña, impidiendo correos duplicados. La contraseña MUST tener un mínimo de 8 caracteres; no se exigen reglas adicionales de complejidad (mayúsculas, números o símbolos).
- **FR-002**: El sistema MUST permitir a un usuario registrado iniciar sesión con su correo electrónico y contraseña.
- **FR-003**: El sistema MUST mantener una sesión activa por usuario autenticado y permitir cerrar sesión. La sesión MUST expirar automáticamente tras 24 horas de inactividad, exigiendo un nuevo inicio de sesión.
- **FR-004**: El sistema MUST bloquear el acceso a la disponibilidad completa y a la creación/gestión de reservas a cualquier usuario sin sesión activa.
- **FR-005**: El sistema MUST restringir la gestión (visualización detallada, cancelación) de una reserva exclusivamente al usuario dueño de esa reserva.
- **FR-006**: El sistema MUST listar de forma estática exactamente 5 canchas: Cancha Laureles, Cancha El Poblado, Cancha Belén, Cancha Robledo y Cancha Envigado.
- **FR-007**: El sistema MUST permitir a un usuario autenticado seleccionar una cancha y una fecha específica para consultar disponibilidad.
- **FR-008**: El sistema MUST mostrar, para la cancha y fecha seleccionadas, una grilla de 24 bloques horarios de una hora cada uno, indicando claramente cuáles están "Disponibles" y cuáles "Reservados".
- **FR-009**: El sistema MUST permitir crear una reserva únicamente sobre un bloque horario completo (por ejemplo 14:00–15:00), sin permitir bloques parciales o de duración distinta a una hora.
- **FR-010**: El sistema MUST impedir la creación de reservas sobre fechas u horarios que ya hayan transcurrido respecto al momento actual.
- **FR-011**: El sistema MUST revalidar, en el momento de confirmar una reserva, que el bloque horario siga disponible para esa cancha y fecha, y MUST rechazar la reserva con un mensaje de error claro si el bloque fue tomado por otro usuario entre la consulta y la confirmación.
- **FR-012**: El sistema MUST garantizar que, ante dos intentos de reserva concurrentes sobre el mismo bloque, cancha y fecha, únicamente uno tenga éxito.
- **FR-013**: El sistema MUST impedir que un usuario tenga más de una reserva activa a la vez, de forma global en todo el club: si el usuario ya tiene una reserva futura vigente (en cualquiera de las 5 canchas), el sistema MUST rechazar cualquier intento de crear una nueva reserva hasta que la anterior se cancele o transcurra. Una reserva se considera "vigente" (y por tanto bloqueante) desde el momento de su creación hasta que llega su hora de **fin**; mientras el bloque reservado está en curso (hora actual entre inicio y fin), la reserva sigue contando como vigente.
- **FR-014**: El sistema MUST proveer a cada usuario autenticado un panel de "Mis reservas" que separe sus reservas futuras de su historial de reservas pasadas.
- **FR-015**: El sistema MUST mostrar, para cada reserva en el panel, al menos el nombre de la cancha, la fecha y la hora.
- **FR-016**: El sistema MUST permitir a un usuario cancelar una reserva futura propia, solicitando una confirmación explícita antes de aplicar la cancelación.
- **FR-017**: El sistema MUST, al cancelar una reserva futura, liberar inmediatamente ese bloque horario para que vuelva a mostrarse como "Disponible" a cualquier usuario.
- **FR-018**: El sistema MUST impedir la cancelación de reservas ya pasadas.
- **FR-019**: El sistema MUST permitir seleccionar en el calendario cualquier fecha futura sin límite máximo de anticipación (no existe un tope de días hacia adelante para reservar).
- **FR-020**: El sistema MUST comunicar todo rechazo de una acción de reserva (colisión de horario, reserva activa existente, fecha pasada, cancha inexistente) mediante un mensaje de error claro y comprensible para el usuario final, sin exponer detalles técnicos internos.
- **FR-021**: El sistema MUST almacenar las contraseñas de los usuarios únicamente mediante un algoritmo de hashing criptográfico seguro y no reversible; en ningún caso se guarda o registra una contraseña en texto plano.

### Key Entities

- **Usuario**: Persona que se registra e inicia sesión con correo electrónico y contraseña; es dueño de cero o más reservas y solo puede gestionar las suyas.
- **Cancha**: Una de las 5 instalaciones fijas del club (Laureles, El Poblado, Belén, Robledo, Envigado); catálogo inmutable, sin atributos configurables por el usuario final.
- **Reserva**: Vínculo entre un Usuario, una Cancha, una fecha y un bloque horario de una hora; tiene un estado (futura/activa, pasada, cancelada) y determina qué bloques se muestran como "Reservados" en la grilla de disponibilidad. La transición de "futura/activa" a "pasada" ocurre en la hora de **fin** del bloque, no en la hora de inicio: mientras el bloque está en curso, la reserva sigue siendo "futura/activa" (vigente, bloqueante y cancelable).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un usuario nuevo puede registrarse, iniciar sesión y llegar a ver la grilla de disponibilidad de una cancha en menos de 2 minutos.
- **SC-002**: Un usuario autenticado puede completar el flujo de selección de cancha, fecha, bloque horario y confirmación de reserva en menos de 1 minuto.
- **SC-003**: El 100% de los intentos de reserva sobre un bloque ya ocupado son rechazados con un mensaje de error entendible, sin que se produzca nunca una doble reserva sobre el mismo bloque, cancha y fecha.
- **SC-004**: El 100% de los intentos de reserva o cancelación sobre fechas/horarios pasados, o sobre reservas de otro usuario, son rechazados.
- **SC-005**: Un usuario puede encontrar y cancelar una reserva futura propia desde su panel de "Mis reservas" en menos de 30 segundos.
- **SC-006**: El estado "Disponible"/"Reservado" que ve cualquier usuario en la grilla siempre refleja el estado real y actualizado del sistema al momento de la consulta.

## Assumptions

- El registro solo requiere correo electrónico y contraseña; no se solicitan otros datos de perfil (nombre, teléfono) en esta iteración.
- El registro no requiere verificación de correo electrónico (sin enlace/código de confirmación); la cuenta queda activa de inmediato tras el registro y no se requiere integrar un servicio de envío de correos.
- No existe en esta iteración un flujo de recuperación/restablecimiento de contraseña olvidada; el usuario que la pierde debe contactar al club por fuera del sistema.
- El club opera conceptualmente 24 horas para efectos de la grilla de disponibilidad (los 24 bloques del día son reservables salvo los que ya transcurrieron); no existe un horario de apertura/cierre distinto que oculte bloques adicionales.
- Una reserva cancelada no cuenta como "reserva activa" ni aparece en el historial de reservas pasadas del usuario como una reserva cumplida; se trata como retirada.
- No hay penalización ni límite de número de cancelaciones por usuario en esta iteración.
- La zona horaria de referencia para "pasado/futuro" es la zona horaria local del club/servidor; no se manejan múltiples zonas horarias de usuario.
