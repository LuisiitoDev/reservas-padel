<!--
Sync Impact Report
- Version change: [TEMPLATE] → 1.0.0 (initial ratification; unfilled placeholder scaffold replaced with concrete project governance)
- Modified principles: none (first real adoption; template placeholders had no prior names)
- Added principles:
  - I. Catálogo Cerrado de Canchas (NON-NEGOTIABLE)
  - II. Prevención de Colisiones y Bloques de 24 Horas (NON-NEGOTIABLE)
  - III. Autenticación Obligatoria (NON-NEGOTIABLE)
  - IV. Simplicidad Estructural y Estilo Funcional
  - V. Errores Amigables y Códigos HTTP Semánticos
  - VI. Disciplina de Alcance — Cero Código Sombra
- Added sections: Stack Tecnológico; Flujo de Trabajo SDD; Governance (amendment/versioning/compliance)
- Removed sections: none
- Templates requiring updates:
  - .specify/templates/*  → ⚠ pending manual review (not modified by this command per scope guard; verify plan/spec/tasks templates reference the 5-cancha catalog, double-booking check, and auth gate where relevant)
- Follow-up TODOs: none — all placeholders resolved from user-supplied constitution text.
-->

# Sistema de Reservas de Pádel Constitution

Aplicación para la reserva de canchas de pádel. Su propósito es permitir a los usuarios
autenticarse y gestionar reservas de tiempo en espacios específicos.

## Core Principles

### I. Catálogo Cerrado de Canchas (NON-NEGOTIABLE)
El sistema SOLO maneja 5 canchas fijas: Cancha Laureles, Cancha El Poblado, Cancha Belén,
Cancha Robledo y Cancha Envigado. Ninguna funcionalidad puede crear, eliminar o parametrizar
canchas adicionales; el catálogo se codifica como conjunto cerrado, no como tabla administrable
por el usuario final. Cualquier cambio a este catálogo requiere una enmienda explícita de esta
constitución antes de tocar el código.
**Rationale**: el dominio del negocio es fijo y conocido de antemano; tratarlo como catálogo
abierto introduciría complejidad de administración innecesaria (YAGNI).

### II. Prevención de Colisiones y Bloques de 24 Horas (NON-NEGOTIABLE)
Las reservas operan en formato de 24 horas. Bajo ninguna circunstancia se escribe una reserva en
la base de datos sin validar primero, dentro de la misma operación atómica, que la cancha
seleccionada esté libre en ese horario. Un conflicto de horario detectado se traduce siempre en
un rechazo explícito de la operación (ver Principio V), nunca en una sobre-escritura silenciosa.
**Rationale**: el double-booking es la regla crítica del sistema; una reserva duplicada rompe la
confianza del usuario y el propósito mismo de la aplicación.

### III. Autenticación Obligatoria (NON-NEGOTIABLE)
Todo flujo de reserva (creación, modificación, cancelación o consulta de reservas propias) exige
una sesión de usuario activa. Ninguna ruta de reserva puede ser accesible sin autenticación
válida.
**Rationale**: las reservas están ligadas a una identidad; sin autenticación no hay forma de
asignar ni proteger la propiedad de una reserva.

### IV. Simplicidad Estructural y Estilo Funcional
Se evita la sobreingeniería: no se implementan Clean Architecture ni patrones complejos. La
estructura del repositorio se mantiene plana: `/frontend`, `/backend`, `/db`. El código prioriza
programación funcional y componentes funcionales de React (Hooks); el uso de clases se evita
salvo que sea obligatorio por una API externa. La nomenclatura usa `camelCase` para
funciones/variables y `PascalCase` para Interfaces/Tipos.
**Rationale**: mantener la base de código simple y predecible acelera la iteración en un
proyecto de alcance acotado y facilita que el agente de IA construya sobre convenciones
consistentes.

### V. Errores Amigables y Códigos HTTP Semánticos
La UI nunca expone errores crudos ni *stack traces* al usuario final; todo error técnico se
traduce a un mensaje amigable (p. ej. "La cancha ya fue reservada en este horario"). El backend
retorna siempre códigos de estado HTTP semánticos: 400 para petición inválida, 401 para no
autenticado y 409 para conflicto de reserva.
**Rationale**: una experiencia de error clara evita confusión del usuario y permite que el
frontend reaccione de forma determinista según el código recibido.

### VI. Disciplina de Alcance — Cero Código Sombra
El agente de IA construye estrictamente lo documentado en `spec.md`. No se añaden
características "por si acaso" (pasarelas de pago, perfiles complejos u otra funcionalidad no
especificada). Si una instrucción del usuario contradice esta constitución o revela una falla
lógica, el trabajo se detiene, se advierte del problema y se solicita actualizar `spec.md` antes
de tocar el código fuente.
**Rationale**: en un flujo Spec-Driven Development, `spec.md` es el contrato de alcance; código
no especificado es deuda técnica y riesgo de seguridad no revisado.

## Stack Tecnológico

- **Frontend / UI**: React, con Tailwind CSS para los estilos.
- **Backend**: Node.js con Express.
- **Base de Datos**: SQLite local (archivo `padel.db`). No se usan ORMs pesados; se usa
  `better-sqlite3` o sentencias SQL puras.
- **Lenguaje**: TypeScript en todo el stack (frontend y backend).

Cualquier adición o cambio de stack (nueva librería, nuevo lenguaje, nuevo motor de base de
datos) requiere una enmienda a esta sección antes de su adopción.

## Flujo de Trabajo SDD

`spec.md` es la fuente de la verdad para el alcance de cada feature. El desarrollo sigue el
flujo Spec Kit (constitution → specify → clarify → plan → tasks → implement). Antes de escribir
o modificar código fuente, toda tarea debe poder trazarse a una sección de `spec.md` vigente.
Si el usuario solicita algo que contradice esta constitución o el `spec.md` activo, o si se
detecta una falla lógica en la especificación, el agente de IA se detiene, explica el conflicto
y solicita la actualización del artefacto correspondiente antes de continuar.

## Governance

Esta constitución prevalece sobre cualquier otra práctica, plantilla o preferencia implícita del
código existente. Toda revisión de código o Pull Request debe verificar cumplimiento con los
Core Principles, en particular los marcados NON-NEGOTIABLE (catálogo cerrado, prevención de
double-booking, autenticación obligatoria). Cualquier complejidad que se aparte del Principio IV
(Simplicidad Estructural) debe justificarse explícitamente en la revisión.

**Procedimiento de enmienda**: los cambios a esta constitución se proponen documentando la
sección afectada, la razón del cambio y su impacto en artefactos dependientes (`plan.md`,
`spec.md`, `tasks.md`); se aplican reescribiendo este archivo y registrando el nuevo número de
versión y fecha de enmienda.

**Política de versionado** (Semantic Versioning): MAJOR para eliminaciones o redefiniciones
incompatibles de principios o reglas de dominio inmutables (Sección 3 original); MINOR para
añadir un principio o sección nueva, o expandir materialmente una guía existente; PATCH para
aclaraciones, correcciones de redacción o refinamientos no semánticos.

**Version**: 1.0.0 | **Ratified**: 2026-09-12 | **Last Amended**: 2026-09-12
