import { Step } from 'react-joyride';

export const businessOwnerTourSteps: Step[] = [
    {
        target: 'body',
        content: (
            <div>
                <h2 className="text-xl font-bold mb-2">¡Bienvenido a ServiConnect! 🎉</h2>
                <p>Te guiaremos por las funciones principales para que puedas empezar a gestionar tu negocio rápidamente.</p>
            </div>
        ),
        placement: 'center',
        disableBeacon: true,
    },
    {
        target: '[data-tour="dashboard"]',
        content: (
            <div>
                <h3 className="font-bold mb-2">📊 Dashboard</h3>
                <p>Aquí verás un resumen de tu negocio: citas de hoy, ingresos, nuevos clientes y más estadísticas importantes.</p>
            </div>
        ),
        placement: 'right',
        disableBeacon: true,
    },
    {
        target: '[data-tour="appointments"]',
        content: (
            <div>
                <h3 className="font-bold mb-2">📅 Gestión de Citas</h3>
                <p>Administra todas tus citas: confirma, completa o cancela reservas. Puedes ver en lista o calendario.</p>
            </div>
        ),
        placement: 'right',
        disableBeacon: true,
    },
    {
        target: '[data-tour="reception"]',
        content: (
            <div>
                <h3 className="font-bold mb-2">🎫 Recepción</h3>
                <p>Crea nuevas citas manualmente para tus clientes que llaman o llegan sin reserva.</p>
            </div>
        ),
        placement: 'right',
        disableBeacon: true,
    },
    {
        target: '[data-tour="services"]',
        content: (
            <div>
                <h3 className="font-bold mb-2">✂️ Servicios</h3>
                <p>Gestiona los servicios que ofreces: agrega, edita o elimina servicios con sus precios y duración.</p>
            </div>
        ),
        placement: 'right',
        disableBeacon: true,
    },
    {
        target: '[data-tour="staff"]',
        content: (
            <div>
                <h3 className="font-bold mb-2">👥 Equipo</h3>
                <p>Administra tu equipo de trabajo: agrega empleados, asigna servicios y gestiona sus horarios.</p>
            </div>
        ),
        placement: 'right',
        disableBeacon: true,
    },
    {
        target: '[data-tour="schedule"]',
        content: (
            <div>
                <h3 className="font-bold mb-2">🕐 Horarios</h3>
                <p>Configura los horarios de atención de tu negocio y los días festivos.</p>
            </div>
        ),
        placement: 'right',
        disableBeacon: true,
    },
    {
        target: '[data-tour="analytics"]',
        content: (
            <div>
                <h3 className="font-bold mb-2">📈 Analíticas</h3>
                <p>Visualiza reportes detallados de ingresos, citas y rendimiento de tu negocio.</p>
            </div>
        ),
        placement: 'right',
        disableBeacon: true,
    },
    {
        target: 'body',
        content: (
            <div>
                <h2 className="text-xl font-bold mb-2">¡Listo para empezar! 🚀</h2>
                <p className="mb-3">Ya conoces las funciones principales. Puedes reiniciar este tour desde Configuración cuando quieras.</p>
                <p className="text-sm text-gray-600">💡 Tip: Comienza agregando tus servicios y tu equipo para recibir las primeras reservas.</p>
            </div>
        ),
        placement: 'center',
    },
];

export const employeeTourSteps: Step[] = [
    {
        target: 'body',
        content: (
            <div>
                <h2 className="text-xl font-bold mb-2">¡Bienvenido! 👋</h2>
                <p>Te mostraremos cómo usar la plataforma para gestionar tus citas.</p>
            </div>
        ),
        placement: 'center',
        disableBeacon: true,
    },
    {
        target: '[data-tour="dashboard"]',
        content: (
            <div>
                <h3 className="font-bold mb-2">📊 Tu Dashboard</h3>
                <p>Aquí verás tus citas del día y tu agenda personal.</p>
            </div>
        ),
        placement: 'right',
        disableBeacon: true,
    },
    {
        target: '[data-tour="appointments"]',
        content: (
            <div>
                <h3 className="font-bold mb-2">📅 Tus Citas</h3>
                <p>Revisa todas las citas asignadas a ti. Puedes marcarlas como completadas cuando termines.</p>
            </div>
        ),
        placement: 'right',
        disableBeacon: true,
    },
    {
        target: '[data-tour="schedule"]',
        content: (
            <div>
                <h3 className="font-bold mb-2">🕐 Tu Horario</h3>
                <p>Consulta y gestiona tu disponibilidad semanal.</p>
            </div>
        ),
        placement: 'right',
        disableBeacon: true,
    },
    {
        target: 'body',
        content: (
            <div>
                <h2 className="text-xl font-bold mb-2">¡Todo listo! ✅</h2>
                <p>Ya sabes cómo navegar por la plataforma. ¡Éxito en tu trabajo!</p>
            </div>
        ),
        placement: 'center',
    },
];

export const clientTourSteps: Step[] = [
    {
        target: 'body',
        content: (
            <div>
                <h2 className="text-xl font-bold mb-2">¡Bienvenido! 🎉</h2>
                <p>Te mostraremos cómo usar la plataforma para gestionar tus citas.</p>
            </div>
        ),
        placement: 'center',
        disableBeacon: true,
    },
    {
        target: '[data-tour="explore"]',
        content: (
            <div>
                <h3 className="font-bold mb-2">🔍 Explorar</h3>
                <p>Descubre negocios cerca de ti y reserva tus servicios favoritos.</p>
            </div>
        ),
        placement: 'right',
        disableBeacon: true,
    },
    {
        target: '[data-tour="dashboard"]',
        content: (
            <div>
                <h3 className="font-bold mb-2">📅 Mis Citas</h3>
                <p>Aquí verás todas tus citas programadas y el historial de servicios.</p>
            </div>
        ),
        placement: 'right',
        disableBeacon: true,
    },
    {
        target: 'body',
        content: (
            <div>
                <h2 className="text-xl font-bold mb-2">¡Listo! 🚀</h2>
                <p>Ya puedes empezar a reservar tus servicios favoritos.</p>
            </div>
        ),
        placement: 'center',
    },
];
