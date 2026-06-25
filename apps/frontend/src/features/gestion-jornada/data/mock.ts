import type {
  Project,
  Task,
  AppNotification
} from "./types.js";

export const MOCK_PROJECTS: Project[] = [
  {
    id: "proj-1",
    name: "Automatización de informes RPA",
    description: "Desarrollo de bots para generación automática de informes mensuales de producción.",
    status: "open",
    openedAt: "2026-04-01T08:00:00Z",
    closedAt: null,
    createdAt: "2026-04-01T08:00:00Z",
    updatedAt: "2026-05-05T10:30:00Z"
  },
  {
    id: "proj-2",
    name: "Migración datos SAP",
    description: "Extracción y limpieza de datos maestros para la migración al nuevo módulo de SAP.",
    status: "open",
    openedAt: "2026-03-15T09:00:00Z",
    closedAt: null,
    createdAt: "2026-03-15T09:00:00Z",
    updatedAt: "2026-05-04T16:00:00Z"
  },
  {
    id: "proj-3",
    name: "Formación equipo RPA Q1",
    description: "Sesiones de formación interna sobre UiPath y Power Automate para el equipo.",
    status: "closed",
    openedAt: "2026-01-10T08:00:00Z",
    closedAt: "2026-03-31T17:00:00Z",
    createdAt: "2026-01-10T08:00:00Z",
    updatedAt: "2026-03-31T17:00:00Z"
  },
  {
    id: "proj-4",
    name: "Dashboard de KPIs producción",
    description: "Diseño e implementación de un cuadro de mandos en Power BI para el seguimiento de KPIs de producción en tiempo real.",
    status: "open",
    openedAt: "2026-04-20T09:00:00Z",
    closedAt: null,
    createdAt: "2026-04-20T09:00:00Z",
    updatedAt: "2026-05-06T08:00:00Z"
  }
];

export const MOCK_TASKS: Task[] = [
  {
    id: "task-1",
    projectId: "proj-1",
    title: "Revisar flujo de extracción de datos KPI",
    description: "Análisis del bot de extracción para identificar puntos de fallo con el nuevo formato de la BBDD.",
    taskDate: "2026-05-06",
    timeSpentMinutes: 90,
    priority: "high",
    status: "in_progress",
    dueDate: "2026-05-07",
    closedAt: null,
    createdAt: "2026-05-06T08:30:00Z",
    updatedAt: "2026-05-06T10:00:00Z",
    subtasks: [
      {
        id: "sub-1",
        taskId: "task-1",
        title: "Mapear nuevos campos de la BBDD",
        priority: "high",
        status: "completed",
        dueDate: "2026-05-06",
        closedAt: "2026-05-06T09:30:00Z",
        createdAt: "2026-05-06T08:30:00Z",
        updatedAt: "2026-05-06T09:30:00Z"
      },
      {
        id: "sub-2",
        taskId: "task-1",
        title: "Actualizar script de transformación",
        priority: "high",
        status: "pending",
        dueDate: "2026-05-07",
        closedAt: null,
        createdAt: "2026-05-06T08:30:00Z",
        updatedAt: "2026-05-06T08:30:00Z"
      }
    ],
    attachments: [
      {
        id: "att-1",
        taskId: "task-1",
        fileName: "esquema_bbdd_v2.pdf",
        fileType: "pdf",
        fileSizeBytes: 245000,
        isDeleted: false,
        deletedAt: null,
        attachedAt: "2026-05-06T08:45:00Z"
      }
    ]
  },
  {
    id: "task-2",
    projectId: "proj-1",
    title: "Reunión con IT sobre permisos de acceso",
    description: "Coordinación para obtener permisos de lectura en el servidor de informes.",
    taskDate: "2026-05-06",
    timeSpentMinutes: 45,
    priority: "medium",
    status: "completed",
    dueDate: null,
    closedAt: "2026-05-06T11:30:00Z",
    createdAt: "2026-05-06T11:00:00Z",
    updatedAt: "2026-05-06T11:30:00Z",
    subtasks: [],
    attachments: []
  },
  {
    id: "task-3",
    projectId: "proj-2",
    title: "Validación de datos maestros de materiales",
    description: "Revisión de 500 registros de materiales para detectar duplicados y datos incompletos.",
    taskDate: "2026-05-05",
    timeSpentMinutes: 180,
    priority: "high",
    status: "blocked",
    dueDate: "2026-05-08",
    closedAt: null,
    createdAt: "2026-05-05T09:00:00Z",
    updatedAt: "2026-05-05T17:00:00Z",
    subtasks: [
      {
        id: "sub-3",
        taskId: "task-3",
        title: "Exportar listado actualizado de SAP",
        priority: "high",
        status: "completed",
        dueDate: null,
        closedAt: "2026-05-05T10:00:00Z",
        createdAt: "2026-05-05T09:00:00Z",
        updatedAt: "2026-05-05T10:00:00Z"
      },
      {
        id: "sub-4",
        taskId: "task-3",
        title: "Comparar con listado anterior y marcar diferencias",
        priority: "medium",
        status: "pending",
        dueDate: "2026-05-08",
        closedAt: null,
        createdAt: "2026-05-05T09:00:00Z",
        updatedAt: "2026-05-05T09:00:00Z"
      }
    ],
    attachments: [
      {
        id: "att-2",
        taskId: "task-3",
        fileName: "materiales_sap_mayo.xlsx",
        fileType: "excel",
        fileSizeBytes: 1200000,
        isDeleted: false,
        deletedAt: null,
        attachedAt: "2026-05-05T09:15:00Z"
      },
      {
        id: "att-3",
        taskId: "task-3",
        fileName: "captura_error_sap.png",
        fileType: "image",
        fileSizeBytes: 87000,
        isDeleted: false,
        deletedAt: null,
        attachedAt: "2026-05-05T16:45:00Z"
      }
    ]
  },
  {
    id: "task-4",
    projectId: "proj-1",
    title: "Documentar arquitectura del bot de KPIs",
    description: "Redacción del documento técnico con el diagrama de flujo y descripción de componentes.",
    taskDate: "2026-05-05",
    timeSpentMinutes: 120,
    priority: "medium",
    status: "in_progress",
    dueDate: "2026-05-09",
    closedAt: null,
    createdAt: "2026-05-05T14:00:00Z",
    updatedAt: "2026-05-05T16:00:00Z",
    subtasks: [],
    attachments: []
  },
  {
    id: "task-5",
    projectId: "proj-4",
    title: "Diseño wireframes dashboard KPI",
    description: "Bocetos iniciales del layout de paneles, filtros y gráficas principales.",
    taskDate: "2026-05-04",
    timeSpentMinutes: 150,
    priority: "high",
    status: "completed",
    dueDate: "2026-05-05",
    closedAt: "2026-05-05T17:00:00Z",
    createdAt: "2026-05-04T09:00:00Z",
    updatedAt: "2026-05-05T17:00:00Z",
    subtasks: [
      {
        id: "sub-5",
        taskId: "task-5",
        title: "Definir KPIs a mostrar en portada",
        priority: "high",
        status: "completed",
        dueDate: "2026-05-04",
        closedAt: "2026-05-04T12:00:00Z",
        createdAt: "2026-05-04T09:00:00Z",
        updatedAt: "2026-05-04T12:00:00Z"
      },
      {
        id: "sub-6",
        taskId: "task-5",
        title: "Validar wireframes con responsable de producción",
        priority: "medium",
        status: "completed",
        dueDate: "2026-05-05",
        closedAt: "2026-05-05T16:30:00Z",
        createdAt: "2026-05-04T09:00:00Z",
        updatedAt: "2026-05-05T16:30:00Z"
      }
    ],
    attachments: [
      {
        id: "att-4",
        taskId: "task-5",
        fileName: "wireframes_dashboard_v1.pdf",
        fileType: "pdf",
        fileSizeBytes: 890000,
        isDeleted: false,
        deletedAt: null,
        attachedAt: "2026-05-05T16:00:00Z"
      }
    ]
  },
  {
    id: "task-6",
    projectId: "proj-4",
    title: "Conectar fuentes de datos Power BI",
    description: "Configuración de las conexiones a SAP y a la BBDD Oracle para alimentar el dashboard.",
    taskDate: "2026-05-06",
    timeSpentMinutes: 60,
    priority: "high",
    status: "in_progress",
    dueDate: "2026-05-12",
    closedAt: null,
    createdAt: "2026-05-06T09:00:00Z",
    updatedAt: "2026-05-06T10:00:00Z",
    subtasks: [],
    attachments: []
  },
  {
    id: "task-7",
    projectId: "proj-2",
    title: "Definir mapeo de campos entre sistemas",
    description: "Documento de equivalencias entre campos de SAP legacy y el nuevo sistema de destino.",
    taskDate: "2026-05-03",
    timeSpentMinutes: 200,
    priority: "high",
    status: "completed",
    dueDate: "2026-05-04",
    closedAt: "2026-05-04T15:00:00Z",
    createdAt: "2026-05-03T08:00:00Z",
    updatedAt: "2026-05-04T15:00:00Z",
    subtasks: [],
    attachments: [
      {
        id: "att-5",
        taskId: "task-7",
        fileName: "mapeo_campos_sap.xlsx",
        fileType: "excel",
        fileSizeBytes: 340000,
        isDeleted: false,
        deletedAt: null,
        attachedAt: "2026-05-04T14:30:00Z"
      }
    ]
  },
  {
    id: "task-8",
    projectId: "proj-1",
    title: "Prueba de carga del bot en entorno preproducción",
    description: "Ejecución de 100 iteraciones del bot con datos reales para detectar cuellos de botella.",
    taskDate: "2026-05-07",
    timeSpentMinutes: null,
    priority: "medium",
    status: "pending",
    dueDate: "2026-05-10",
    closedAt: null,
    createdAt: "2026-05-06T12:00:00Z",
    updatedAt: "2026-05-06T12:00:00Z",
    subtasks: [],
    attachments: []
  },
  {
    id: "task-9",
    projectId: "proj-4",
    title: "Publicar primera versión del dashboard en SharePoint",
    description: "Despliegue del informe en el portal interno de la empresa con permisos por departamento.",
    taskDate: "2026-05-07",
    timeSpentMinutes: null,
    priority: "medium",
    status: "pending",
    dueDate: "2026-05-14",
    closedAt: null,
    createdAt: "2026-05-06T13:00:00Z",
    updatedAt: "2026-05-06T13:00:00Z",
    subtasks: [],
    attachments: []
  },
  {
    id: "task-10",
    projectId: "proj-2",
    title: "Ejecutar scripts de migración en entorno de pruebas",
    description: "Primera ejecución completa del proceso de migración sobre una copia del entorno productivo.",
    taskDate: "2026-05-06",
    timeSpentMinutes: 240,
    priority: "high",
    status: "blocked",
    dueDate: "2026-05-08",
    closedAt: null,
    createdAt: "2026-05-06T07:00:00Z",
    updatedAt: "2026-05-06T14:00:00Z",
    subtasks: [
      {
        id: "sub-7",
        taskId: "task-10",
        title: "Preparar entorno de pruebas",
        priority: "high",
        status: "completed",
        dueDate: "2026-05-06",
        closedAt: "2026-05-06T09:00:00Z",
        createdAt: "2026-05-06T07:00:00Z",
        updatedAt: "2026-05-06T09:00:00Z"
      },
      {
        id: "sub-8",
        taskId: "task-10",
        title: "Resolver error en script de proveedor",
        priority: "high",
        status: "pending",
        dueDate: "2026-05-07",
        closedAt: null,
        createdAt: "2026-05-06T14:00:00Z",
        updatedAt: "2026-05-06T14:00:00Z"
      }
    ],
    attachments: [
      {
        id: "att-6",
        taskId: "task-10",
        fileName: "log_error_migracion.txt",
        fileType: "other",
        fileSizeBytes: 12000,
        isDeleted: false,
        deletedAt: null,
        attachedAt: "2026-05-06T14:00:00Z"
      }
    ]
  }
];

export const MOCK_NOTIFICATIONS: AppNotification[] = [
  {
    id: "notif-1",
    type: "due_date_reminder",
    channel: "in_app",
    taskId: "task-1",
    subtaskId: null,
    sentAt: "2026-05-06T08:00:00Z",
    isRead: false,
    taskTitle: "Revisar flujo de extracción de datos KPI"
  },
  {
    id: "notif-2",
    type: "due_date_reminder",
    channel: "in_app",
    taskId: null,
    subtaskId: "sub-2",
    sentAt: "2026-05-06T08:00:00Z",
    isRead: false,
    subtaskTitle: "Actualizar script de transformación"
  },
  {
    id: "notif-3",
    type: "due_date_reminder",
    channel: "in_app",
    taskId: "task-3",
    subtaskId: null,
    sentAt: "2026-05-05T08:00:00Z",
    isRead: true,
    taskTitle: "Validación de datos maestros de materiales"
  },
  {
    id: "notif-4",
    type: "due_date_reminder",
    channel: "in_app",
    taskId: "task-10",
    subtaskId: null,
    sentAt: "2026-05-06T07:00:00Z",
    isRead: false,
    taskTitle: "Ejecutar scripts de migración en entorno de pruebas"
  }
];
