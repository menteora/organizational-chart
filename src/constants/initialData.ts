/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { OrgArea, OrgNode, OrgLink } from '../types';

export const DEFAULT_REVISION = 'REV.07';
export const DEFAULT_EXPORT_DATE = '20260624';

/**
 * Normalizes tab and sheet title for display:
 * Converts "Processi di Supporto" or "di Supporto" to "Supporto", etc.
 */
export function formatSheetTabTitle(title: string): string {
  if (!title) return 'Foglio';
  const trimmed = title.trim();
  if (/^processi di supporto$/i.test(trimmed) || /^di supporto$/i.test(trimmed)) {
    return 'Supporto';
  }
  return trimmed.replace(/^Processi (di )?/i, '').trim() || trimmed;
}

/**
 * Base data for the EMPTY application:
 * Completely clean with NO pre-saved people, departments, or roles.
 */
export const INITIAL_AREAS: OrgArea[] = [
  {
    id: 'supporto',
    key: 'SUPPORTO',
    title: 'Supporto',
    description: 'Organigramma Supporto',
    rootNodeId: '',
    rawMermaid: '',
    nodes: [],
    links: [],
  },
];

export const DEMO_RAW_MERMAID_SUPPORTO = `---
config:
  theme: mc
---
flowchart LR
    SUP["PROCESSI DI <br>SUPPORTO"] --> AMMIN["AMMINISTRAZIONE E FINANZA"] & SICUREZZA["SICUREZZA"] & ACQUISTI["ACQUISTI"] & MARKETING["MARKETING <br>ED EVENTI"] & IT["IT"] & LOGISTICA["LOGISTICA <br>E ORDINI"] & DPO["DPO"]
    AMMIN --> CFO["CFO<br>(Sabrina Lopreite)"]
    CFO --> SAA["Junior Account Assistant<br>(Maria Teaca)"]
    SICUREZZA --> RSPP["RSPP<br>(Francesco Vezù)"] & MC["Medico Competente<br>(Davide Trufelli)"] & PREPOSTI["PREPOSTI"]
    RSPP --> RLS["RLS<br>(Francesco Mantella)"] & ADD_ANT_PASQ["Addetto Antincendio<br>(Alessandro Pasquali)"] & ADD_ANT_MIN["Addetto Antincendio<br>(Alec Minelli)"] & ADD_PRIM_MUS["Addetto primo soccorso<br>(Valeria Musso)"] & ADD_PRIM_BRANC["Addetto primo soccorso<br>(Lisa Brancaleoni)"] & ADD_PRIM_MANT["Addetto primo soccorso<br>(Francesco Mantella)"]
    RLS --> SUP_RLS["Supporto RLS<br>(Sabrina Lopreite)"]
    PREPOSTI --> PREP_PAR["Preposto<br>(Stefano Parisini)"] & PREP_SELL["Preposto<br>(Stefano Selleri)"] & PREP_MANT["Preposto<br>(Francesco Mantella)"] & PREP_LOP["Preposto<br>(Sabrina Lopreite)"] & PREP_BRANC["Preposto<br>(Lisa Brancaleoni)"]
    ACQUISTI --> PM_ACQ["Purchasing Manager<br>(Stefano Parisini)"]
    PM_ACQ --> PO["Purchase Officer<br>(Alessandro Pasquali)"]
    MARKETING --> MM["Marketing Manager<br>(Irene Castelli)"]
    MM --> MES["Marketing &amp; Event Specialist<br>(Valeria Musso)"] & GG["Digital Marketing &amp; GEO Specialist<br>(Giulia Gandini)"]
    IT --> ITM@{ label: "IT Manager &amp; CHO<br>(Luca D'Amico)" }
    ITM --> ITS["IT Support Specialist<br>(Nino Mazzoni)"]
    LOGISTICA --> WOM["Warehouse &amp; Order Manager<br>(Lisa Brancaleoni)"]
    WOM --> WEL["Warehouse Expert &amp; Logistics Analyst<br>(Alec Minelli)"]
    DPO --> DPO_P["DPO<br>(Giampaolo Spaggiari)"]
    DPO_P --> DPO_CFO["CFO<br>(Sabrina Lopreite)"] & DPO_IT@{ label: "IT Manager &amp; CHO<br>(Luca D'Amico)" }

    ITM@{ shape: rect}
    DPO_IT@{ shape: rect}
     SUP:::processo
     AMMIN:::reparto
     SICUREZZA:::reparto
     ACQUISTI:::reparto
     MARKETING:::reparto
     IT:::reparto
     LOGISTICA:::reparto
     DPO:::reparto
     CFO:::responsabile
     SAA:::membro
     RSPP:::responsabile
     PREPOSTI:::reparto
     MC:::responsabile
     PREP_PAR:::membro
     RLS:::membro
     ADD_ANT_PASQ:::membro
     ADD_ANT_MIN:::membro
     SUP_RLS:::membro
     PREP_SELL:::membro
     PREP_MANT:::membro
     PREP_LOP:::membro
     PREP_BRANC:::membro
     ADD_PRIM_MUS:::membro
     ADD_PRIM_BRANC:::membro
     ADD_PRIM_MANT:::membro
     PM_ACQ:::responsabile
     PO:::membro
     MM:::responsabile
     MES:::membro
     GG:::membro
     ITM:::responsabile
     ITS:::membro
     WOM:::responsabile
     WEL:::membro
     DPO_P:::responsabile
     DPO_CFO:::membro
     DPO_IT:::membro
    classDef processo fill:#e1d5e7,stroke:#9673a6,font-weight:bold
    classDef reparto fill:#f8cecc,stroke:#b85450,font-weight:bold
    classDef responsabile fill:#ffe6cc,stroke:#d79b00
    classDef membro fill:#fff2cc,stroke:#d6b656
    classDef backup fill:#f5f5f5,stroke:#666666,color:#333333`;

export const RAW_MERMAID_STRATEGICI = `---
config:
  theme: mc
---
flowchart LR
    STRAT["PROCESSI<br>STRATEGICI"] --> SOCI["CONSIGLIO <br>DEI SOCI"] & SGI["SGI"] & CG["CONTROLLO <br>DI GESTIONE"] & PDG["COMITATO <br>GUIDA D&amp;I"] & HR["HR"] & DIR["DIREZIONE"]
    SOCI --> SM_S["Sales Manager &amp; Key Account Manager<br>(Stefano Parisini)"] & CEO_S["CEO<br>(Irene Castelli)"]
    SGI --> RSGI["Responsabile del SGI<br>(Irene Castelli)"]
    RSGI --> MSGI1@{ label: "Facilitator<br>(Luca D'Amico)" }
    MSGI1 --> MSGI2["Assistant<br>(Alessandro Pasquali)"]
    CG --> BC["Business Controller<br>(Carmela Mantella)"]
    BC --> JA["Junior Accountant<br>(Claudio Benvenuti)"]
    PDG --> RDI["Facilitator<br>(Irene Castelli)"]
    RDI --> MDIV1@{ label: "D&amp;I Governance Member<br>(Luca D'Amico)" } & MDIV2["D&amp;I Governance Member<br>(Carmela Mantella)"] & PDG_BAS["D&amp;I Governance Assistant<br>(Riccardo Basaglia)"]
    HR --> HRM["HR Manager<br>(Irene Castelli)"]
    HRM --> CHO@{ label: "CHO<br>(Luca D'Amico)" } & PAYROLL["Payroll Manager<br>(Sabrina Lopreite)"] & RECRUITER["Recruiter<br>(Claudio Benvenuti)"] & GPGS["Gender Pay Gap Specialist<br>(Carmela Mantella)"]
    DIR --> CEO_DIR["CEO &amp; COO<br>(Irene Castelli)"]

    MSGI1@{ shape: rect}
    MDIV1@{ shape: rect}
    CHO@{ shape: rect}
     STRAT:::processo
     SOCI:::reparto
     SGI:::reparto
     CG:::reparto
     PDG:::reparto
     HR:::reparto
     DIR:::reparto
     SM_S:::membro
     CEO_S:::membro
     RSGI:::responsabile
     MSGI1:::membro
     MSGI2:::membro
     BC:::responsabile
     JA:::membro
     RDI:::responsabile
     MDIV1:::membro
     MDIV2:::membro
     PDG_BAS:::membro
     HRM:::responsabile
     CHO:::membro
     PAYROLL:::membro
     RECRUITER:::membro
     GPGS:::membro
     CEO_DIR:::responsabile
    classDef processo fill:#e1d5e7,stroke:#9673a6,font-weight:bold
    classDef reparto fill:#f8cecc,stroke:#b85450,font-weight:bold
    classDef responsabile fill:#ffe6cc,stroke:#d79b00
    classDef membro fill:#fff2cc,stroke:#d6b656
    classDef backup fill:#f5f5f5,stroke:#666666,color:#333333`;

export const RAW_MERMAID_CORE = `---
config:
  theme: mc
---
flowchart LR
    CORE["PROCESSI CORE"] --> PV["POST<br>VENDITA"] & MASTER["AREA CODIFICHE E VERIFICATORI"] & CONTRATTI["CONTRATTI"] & VENDITE["VENDITE"] & SVILUPPO["SVILUPPO"]
    PV --> TSS_PV["Technical Support Specialist &amp; Service Manager<br>(Francesco Mantella)"]
    TSS_PV --> TSS1["Technical Support Specialist<br>(Giuseppe Armento)"] & CSS["Customer Service Support<br>(Marina Raineri)"] & TSS2["Technical Support Specialist<br>(Matteo Pagano)"] & TSS3["Technical Support Specialist<br>(Ibrahim Thiaw)"]
    TSS_COD["Technical Support Specialist<br>Area Codifiche e Verificatori<br>(Nino Mazzoni)"] -. backup .-> BACKUP_THIAW["Technical Support Specialist<br>(Ibrahim Thiaw)"]
    MASTER --> BUM@{ label: "BU Manager - Area Codifiche e Verificatori<br>(Luca D'Amico)" }
    BUM --> TSS_COD
    CONTRATTI --> CSM["Contracts &amp; Service Manager (Irene Castelli)"]
    CSM --> CSS_CONTR["Contracts &amp; Service Specialist<br>(Stefania Polidoro)"]
    VENDITE --> SM["Sales Manager &amp; Key Account Manager<br>(Stefano Parisini)"] & AM1["BU Manager - Area Sviluppo (Alessandro Tartari)"]
    SM --> SA["Sales Account<br>(Valentina Casalegno)"] & SPS["Sales Product Specialist - Materiali di consumo<br>(Patrizia Merli)"] & AM2["Area Manager<br>(Manuel Massaccesi)"] & IS["Internal Sales<br>(Roberta Vigorelli)"] & AM3["Area Manager<br>(Danilo Rossoni, Agente Monomandatario)"]
    SVILUPPO --> PM["Project Manager - Print Apply e Software<br>(Stefano Selleri)"]
    PM --> SE["Software Engineer<br>(Gabriele Tassoni, Collaboratore)"] & SD1["Software Developer<br>(Gianluca Gabriele)"] & TSS_SV["Technical Support Specialist<br>(Simone Torrisi)"] & SD2["Software Developer<br>(Santiago Galvan Colorado)"] & PA["Project Assistant - Print Apply e Software<br>(Riccardo Basaglia, Collaboratore)"]

    BUM@{ shape: rect}
     CORE:::processo
     PV:::reparto
     MASTER:::reparto
     CONTRATTI:::reparto
     VENDITE:::reparto
     SVILUPPO:::reparto
     TSS_PV:::responsabile
     TSS1:::membro
     CSS:::membro
     TSS2:::membro
     TSS3:::membro
     TSS_COD:::membro
     BACKUP_THIAW:::backup
     BUM:::responsabile
     CSM:::responsabile
     CSS_CONTR:::membro
     SM:::responsabile
     AM1:::membro
     SA:::membro
     SPS:::membro
     AM2:::membro
     IS:::membro
     AM3:::membro
     PM:::responsabile
     SE:::membro
     SD1:::membro
     TSS_SV:::membro
     SD2:::membro
     PA:::membro
    classDef processo fill:#e1d5e7,stroke:#9673a6,font-weight:bold
    classDef reparto fill:#f8cecc,stroke:#b85450,font-weight:bold
    classDef responsabile fill:#ffe6cc,stroke:#d79b00
    classDef membro fill:#fff2cc,stroke:#d6b656
    classDef backup fill:#f5f5f5,stroke:#666666,color:#333333`;

// Structured Sample Demo Areas (optional reference)
export const DEMO_AREAS: OrgArea[] = [
  {
    id: 'supporto',
    key: 'SUPPORTO',
    title: 'Processi di Supporto',
    description: 'Amministrazione, Finanza, Sicurezza, Acquisti, Marketing, IT, Logistica e DPO',
    rootNodeId: 'SUP',
    rawMermaid: DEMO_RAW_MERMAID_SUPPORTO,
    nodes: [
      { id: 'SUP', role: 'PROCESSI DI SUPPORTO', person: null, rawLabel: 'PROCESSI DI <br>SUPPORTO', category: 'processo', areaId: 'supporto' },
      { id: 'AMMIN', role: 'AMMINISTRAZIONE E FINANZA', person: null, rawLabel: 'AMMINISTRAZIONE E FINANZA', category: 'reparto', areaId: 'supporto' },
      { id: 'SICUREZZA', role: 'SICUREZZA', person: null, rawLabel: 'SICUREZZA', category: 'reparto', areaId: 'supporto' },
      { id: 'ACQUISTI', role: 'ACQUISTI', person: null, rawLabel: 'ACQUISTI', category: 'reparto', areaId: 'supporto' },
      { id: 'MARKETING', role: 'MARKETING ED EVENTI', person: null, rawLabel: 'MARKETING <br>ED EVENTI', category: 'reparto', areaId: 'supporto' },
      { id: 'IT', role: 'IT', person: null, rawLabel: 'IT', category: 'reparto', areaId: 'supporto' },
      { id: 'LOGISTICA', role: 'LOGISTICA E ORDINI', person: null, rawLabel: 'LOGISTICA <br>E ORDINI', category: 'reparto', areaId: 'supporto' },
      { id: 'DPO', role: 'DPO', person: null, rawLabel: 'DPO', category: 'reparto', areaId: 'supporto' },
      { id: 'PREPOSTI', role: 'PREPOSTI', person: null, rawLabel: 'PREPOSTI', category: 'reparto', areaId: 'supporto' },

      // Amministrazione
      { id: 'CFO', role: 'CFO', person: 'Sabrina Lopreite', rawLabel: 'CFO<br>(Sabrina Lopreite)', category: 'responsabile', areaId: 'supporto', departmentId: 'AMMIN' },
      { id: 'SAA', role: 'Junior Account Assistant', person: 'Maria Teaca', rawLabel: 'Junior Account Assistant<br>(Maria Teaca)', category: 'membro', areaId: 'supporto', departmentId: 'AMMIN' },

      // Sicurezza
      { id: 'RSPP', role: 'RSPP', person: 'Francesco Vezù', rawLabel: 'RSPP<br>(Francesco Vezù)', category: 'responsabile', areaId: 'supporto', departmentId: 'SICUREZZA' },
      { id: 'MC', role: 'Medico Competente', person: 'Davide Trufelli', rawLabel: 'Medico Competente<br>(Davide Trufelli)', category: 'responsabile', areaId: 'supporto', departmentId: 'SICUREZZA' },
      { id: 'RLS', role: 'RLS', person: 'Francesco Mantella', rawLabel: 'RLS<br>(Francesco Mantella)', category: 'membro', areaId: 'supporto', departmentId: 'SICUREZZA' },
      { id: 'ADD_ANT_PASQ', role: 'Addetto Antincendio', person: 'Alessandro Pasquali', rawLabel: 'Addetto Antincendio<br>(Alessandro Pasquali)', category: 'membro', areaId: 'supporto', departmentId: 'SICUREZZA' },
      { id: 'ADD_ANT_MIN', role: 'Addetto Antincendio', person: 'Alec Minelli', rawLabel: 'Addetto Antincendio<br>(Alec Minelli)', category: 'membro', areaId: 'supporto', departmentId: 'SICUREZZA' },
      { id: 'ADD_PRIM_MUS', role: 'Addetto primo soccorso', person: 'Valeria Musso', rawLabel: 'Addetto primo soccorso<br>(Valeria Musso)', category: 'membro', areaId: 'supporto', departmentId: 'SICUREZZA' },
      { id: 'ADD_PRIM_BRANC', role: 'Addetto primo soccorso', person: 'Lisa Brancaleoni', rawLabel: 'Addetto primo soccorso<br>(Lisa Brancaleoni)', category: 'membro', areaId: 'supporto', departmentId: 'SICUREZZA' },
      { id: 'ADD_PRIM_MANT', role: 'Addetto primo soccorso', person: 'Francesco Mantella', rawLabel: 'Addetto primo soccorso<br>(Francesco Mantella)', category: 'membro', areaId: 'supporto', departmentId: 'SICUREZZA' },
      { id: 'SUP_RLS', role: 'Supporto RLS', person: 'Sabrina Lopreite', rawLabel: 'Supporto RLS<br>(Sabrina Lopreite)', category: 'membro', areaId: 'supporto', departmentId: 'SICUREZZA' },

      // Preposti
      { id: 'PREP_PAR', role: 'Preposto', person: 'Stefano Parisini', rawLabel: 'Preposto<br>(Stefano Parisini)', category: 'membro', areaId: 'supporto', departmentId: 'PREPOSTI' },
      { id: 'PREP_SELL', role: 'Preposto', person: 'Stefano Selleri', rawLabel: 'Preposto<br>(Stefano Selleri)', category: 'membro', areaId: 'supporto', departmentId: 'PREPOSTI' },
      { id: 'PREP_MANT', role: 'Preposto', person: 'Francesco Mantella', rawLabel: 'Preposto<br>(Francesco Mantella)', category: 'membro', areaId: 'supporto', departmentId: 'PREPOSTI' },
      { id: 'PREP_LOP', role: 'Preposto', person: 'Sabrina Lopreite', rawLabel: 'Preposto<br>(Sabrina Lopreite)', category: 'membro', areaId: 'supporto', departmentId: 'PREPOSTI' },
      { id: 'PREP_BRANC', role: 'Preposto', person: 'Lisa Brancaleoni', rawLabel: 'Preposto<br>(Lisa Brancaleoni)', category: 'membro', areaId: 'supporto', departmentId: 'PREPOSTI' },

      // Acquisti
      { id: 'PM_ACQ', role: 'Purchasing Manager', person: 'Stefano Parisini', rawLabel: 'Purchasing Manager<br>(Stefano Parisini)', category: 'responsabile', areaId: 'supporto', departmentId: 'ACQUISTI' },
      { id: 'PO', role: 'Purchase Officer', person: 'Alessandro Pasquali', rawLabel: 'Purchase Officer<br>(Alessandro Pasquali)', category: 'membro', areaId: 'supporto', departmentId: 'ACQUISTI' },

      // Marketing
      { id: 'MM', role: 'Marketing Manager', person: 'Irene Castelli', rawLabel: 'Marketing Manager<br>(Irene Castelli)', category: 'responsabile', areaId: 'supporto', departmentId: 'MARKETING' },
      { id: 'MES', role: 'Marketing & Event Specialist', person: 'Valeria Musso', rawLabel: 'Marketing & Event Specialist<br>(Valeria Musso)', category: 'membro', areaId: 'supporto', departmentId: 'MARKETING' },
      { id: 'GG', role: 'Digital Marketing & GEO Specialist', person: 'Giulia Gandini', rawLabel: 'Digital Marketing & GEO Specialist<br>(Giulia Gandini)', category: 'membro', areaId: 'supporto', departmentId: 'MARKETING' },

      // IT
      { id: 'ITM', role: 'IT Manager & CHO', person: "Luca D'Amico", rawLabel: "IT Manager & CHO<br>(Luca D'Amico)", category: 'responsabile', areaId: 'supporto', departmentId: 'IT', shape: 'rect' },
      { id: 'ITS', role: 'IT Support Specialist', person: 'Nino Mazzoni', rawLabel: 'IT Support Specialist<br>(Nino Mazzoni)', category: 'membro', areaId: 'supporto', departmentId: 'IT' },

      // Logistica
      { id: 'WOM', role: 'Warehouse & Order Manager', person: 'Lisa Brancaleoni', rawLabel: 'Warehouse & Order Manager<br>(Lisa Brancaleoni)', category: 'responsabile', areaId: 'supporto', departmentId: 'LOGISTICA' },
      { id: 'WEL', role: 'Warehouse Expert & Logistics Analyst', person: 'Alec Minelli', rawLabel: 'Warehouse Expert & Logistics Analyst<br>(Alec Minelli)', category: 'membro', areaId: 'supporto', departmentId: 'LOGISTICA' },

      // DPO
      { id: 'DPO_P', role: 'DPO', person: 'Giampaolo Spaggiari', rawLabel: 'DPO<br>(Giampaolo Spaggiari)', category: 'responsabile', areaId: 'supporto', departmentId: 'DPO' },
      { id: 'DPO_CFO', role: 'CFO', person: 'Sabrina Lopreite', rawLabel: 'CFO<br>(Sabrina Lopreite)', category: 'membro', areaId: 'supporto', departmentId: 'DPO' },
      { id: 'DPO_IT', role: 'IT Manager & CHO', person: "Luca D'Amico", rawLabel: "IT Manager & CHO<br>(Luca D'Amico)", category: 'membro', areaId: 'supporto', departmentId: 'DPO', shape: 'rect' },
    ],
    links: [
      { id: 'sup-ammin', source: 'SUP', target: 'AMMIN', linkType: 'standard' },
      { id: 'sup-sicurezza', source: 'SUP', target: 'SICUREZZA', linkType: 'standard' },
      { id: 'sup-acquisti', source: 'SUP', target: 'ACQUISTI', linkType: 'standard' },
      { id: 'sup-marketing', source: 'SUP', target: 'MARKETING', linkType: 'standard' },
      { id: 'sup-it', source: 'SUP', target: 'IT', linkType: 'standard' },
      { id: 'sup-logistica', source: 'SUP', target: 'LOGISTICA', linkType: 'standard' },
      { id: 'sup-dpo', source: 'SUP', target: 'DPO', linkType: 'standard' },

      { id: 'ammin-cfo', source: 'AMMIN', target: 'CFO', linkType: 'standard' },
      { id: 'cfo-saa', source: 'CFO', target: 'SAA', linkType: 'standard' },

      { id: 'sic-rspp', source: 'SICUREZZA', target: 'RSPP', linkType: 'standard' },
      { id: 'sic-mc', source: 'SICUREZZA', target: 'MC', linkType: 'standard' },
      { id: 'sic-preposti', source: 'SICUREZZA', target: 'PREPOSTI', linkType: 'standard' },
      { id: 'rspp-rls', source: 'RSPP', target: 'RLS', linkType: 'standard' },
      { id: 'rspp-ant_pasq', source: 'RSPP', target: 'ADD_ANT_PASQ', linkType: 'standard' },
      { id: 'rspp-ant_min', source: 'RSPP', target: 'ADD_ANT_MIN', linkType: 'standard' },
      { id: 'rspp-prim_mus', source: 'RSPP', target: 'ADD_PRIM_MUS', linkType: 'standard' },
      { id: 'rspp-prim_branc', source: 'RSPP', target: 'ADD_PRIM_BRANC', linkType: 'standard' },
      { id: 'rspp-prim_mant', source: 'RSPP', target: 'ADD_PRIM_MANT', linkType: 'standard' },
      { id: 'rls-sup_rls', source: 'RLS', target: 'SUP_RLS', linkType: 'standard' },

      { id: 'prep-par', source: 'PREPOSTI', target: 'PREP_PAR', linkType: 'standard' },
      { id: 'prep-sell', source: 'PREPOSTI', target: 'PREP_SELL', linkType: 'standard' },
      { id: 'prep-mant', source: 'PREPOSTI', target: 'PREP_MANT', linkType: 'standard' },
      { id: 'prep-lop', source: 'PREPOSTI', target: 'PREP_LOP', linkType: 'standard' },
      { id: 'prep-branc', source: 'PREPOSTI', target: 'PREP_BRANC', linkType: 'standard' },

      { id: 'acq-pm', source: 'ACQUISTI', target: 'PM_ACQ', linkType: 'standard' },
      { id: 'pm-po', source: 'PM_ACQ', target: 'PO', linkType: 'standard' },

      { id: 'mkt-mm', source: 'MARKETING', target: 'MM', linkType: 'standard' },
      { id: 'mm-mes', source: 'MM', target: 'MES', linkType: 'standard' },
      { id: 'mm-gg', source: 'MM', target: 'GG', linkType: 'standard' },

      { id: 'it-itm', source: 'IT', target: 'ITM', linkType: 'standard' },
      { id: 'itm-its', source: 'ITM', target: 'ITS', linkType: 'standard' },

      { id: 'log-wom', source: 'LOGISTICA', target: 'WOM', linkType: 'standard' },
      { id: 'wom-wel', source: 'WOM', target: 'WEL', linkType: 'standard' },

      { id: 'dpo-dpop', source: 'DPO', target: 'DPO_P', linkType: 'standard' },
      { id: 'dpop-cfo', source: 'DPO_P', target: 'DPO_CFO', linkType: 'standard' },
      { id: 'dpop-it', source: 'DPO_P', target: 'DPO_IT', linkType: 'standard' },
    ]
  },
  {
    id: 'strategici',
    key: 'STRATEGICI',
    title: 'Processi Strategici',
    description: 'Consiglio dei Soci, SGI, Controllo di Gestione, Comitato PdG e D&I, HR, Direzione',
    rootNodeId: 'STRAT',
    rawMermaid: RAW_MERMAID_STRATEGICI,
    nodes: [
      { id: 'STRAT', role: 'PROCESSI STRATEGICI', person: null, rawLabel: 'PROCESSI<br>STRATEGICI', category: 'processo', areaId: 'strategici' },
      { id: 'SOCI', role: 'CONSIGLIO DEI SOCI', person: null, rawLabel: 'CONSIGLIO <br>DEI SOCI', category: 'reparto', areaId: 'strategici' },
      { id: 'SGI', role: 'SGI', person: null, rawLabel: 'SGI', category: 'reparto', areaId: 'strategici' },
      { id: 'CG', role: 'CONTROLLO DI GESTIONE', person: null, rawLabel: 'CONTROLLO <br>DI GESTIONE', category: 'reparto', areaId: 'strategici' },
      { id: 'PDG', role: 'COMITATO GUIDA D&I', person: null, rawLabel: 'COMITATO <br>GUIDA D&I', category: 'reparto', areaId: 'strategici' },
      { id: 'HR', role: 'HR', person: null, rawLabel: 'HR', category: 'reparto', areaId: 'strategici' },
      { id: 'DIR', role: 'DIREZIONE', person: null, rawLabel: 'DIREZIONE', category: 'reparto', areaId: 'strategici' },

      // Soci
      { id: 'SM_S', role: 'Sales Manager & Key Account Manager', person: 'Stefano Parisini', rawLabel: 'Sales Manager & Key Account Manager<br>(Stefano Parisini)', category: 'membro', areaId: 'strategici', departmentId: 'SOCI' },
      { id: 'CEO_S', role: 'CEO', person: 'Irene Castelli', rawLabel: 'CEO<br>(Irene Castelli)', category: 'membro', areaId: 'strategici', departmentId: 'SOCI' },

      // SGI
      { id: 'RSGI', role: 'Responsabile del SGI', person: 'Irene Castelli', rawLabel: 'Responsabile del SGI<br>(Irene Castelli)', category: 'responsabile', areaId: 'strategici', departmentId: 'SGI' },
      { id: 'MSGI1', role: 'Facilitator', person: "Luca D'Amico", rawLabel: "Facilitator<br>(Luca D'Amico)", category: 'membro', areaId: 'strategici', departmentId: 'SGI', shape: 'rect' },
      { id: 'MSGI2', role: 'Assistant', person: 'Alessandro Pasquali', rawLabel: 'Assistant<br>(Alessandro Pasquali)', category: 'membro', areaId: 'strategici', departmentId: 'SGI' },

      // Controllo Gestione
      { id: 'BC', role: 'Business Controller', person: 'Carmela Mantella', rawLabel: 'Business Controller<br>(Carmela Mantella)', category: 'responsabile', areaId: 'strategici', departmentId: 'CG' },
      { id: 'JA', role: 'Junior Accountant', person: 'Claudio Benvenuti', rawLabel: 'Junior Accountant<br>(Claudio Benvenuti)', category: 'membro', areaId: 'strategici', departmentId: 'CG' },

      // Comitato Guida D&I
      { id: 'RDI', role: 'Facilitator', person: 'Irene Castelli', rawLabel: 'Facilitator<br>(Irene Castelli)', category: 'responsabile', areaId: 'strategici', departmentId: 'PDG' },
      { id: 'MDIV1', role: 'D&I Governance Member', person: "Luca D'Amico", rawLabel: "D&I Governance Member<br>(Luca D'Amico)", category: 'membro', areaId: 'strategici', departmentId: 'PDG', shape: 'rect' },
      { id: 'MDIV2', role: 'D&I Governance Member', person: 'Carmela Mantella', rawLabel: 'D&I Governance Member<br>(Carmela Mantella)', category: 'membro', areaId: 'strategici', departmentId: 'PDG' },
      { id: 'PDG_BAS', role: 'D&I Governance Assistant', person: 'Riccardo Basaglia', rawLabel: 'D&I Governance Assistant<br>(Riccardo Basaglia)', category: 'membro', areaId: 'strategici', departmentId: 'PDG' },

      // HR
      { id: 'HRM', role: 'HR Manager', person: 'Irene Castelli', rawLabel: 'HR Manager<br>(Irene Castelli)', category: 'responsabile', areaId: 'strategici', departmentId: 'HR' },
      { id: 'CHO', role: 'CHO', person: "Luca D'Amico", rawLabel: "CHO<br>(Luca D'Amico)", category: 'membro', areaId: 'strategici', departmentId: 'HR', shape: 'rect' },
      { id: 'PAYROLL', role: 'Payroll Manager', person: 'Sabrina Lopreite', rawLabel: 'Payroll Manager<br>(Sabrina Lopreite)', category: 'membro', areaId: 'strategici', departmentId: 'HR' },
      { id: 'RECRUITER', role: 'Recruiter', person: 'Claudio Benvenuti', rawLabel: 'Recruiter<br>(Claudio Benvenuti)', category: 'membro', areaId: 'strategici', departmentId: 'HR' },
      { id: 'GPGS', role: 'Gender Pay Gap Specialist', person: 'Carmela Mantella', rawLabel: 'Gender Pay Gap Specialist<br>(Carmela Mantella)', category: 'membro', areaId: 'strategici', departmentId: 'HR' },

      // Direzione
      { id: 'CEO_DIR', role: 'CEO & COO', person: 'Irene Castelli', rawLabel: 'CEO & COO<br>(Irene Castelli)', category: 'responsabile', areaId: 'strategici', departmentId: 'DIR' },
    ],
    links: [
      { id: 'strat-soci', source: 'STRAT', target: 'SOCI', linkType: 'standard' },
      { id: 'strat-sgi', source: 'STRAT', target: 'SGI', linkType: 'standard' },
      { id: 'strat-cg', source: 'STRAT', target: 'CG', linkType: 'standard' },
      { id: 'strat-pdg', source: 'STRAT', target: 'PDG', linkType: 'standard' },
      { id: 'strat-hr', source: 'STRAT', target: 'HR', linkType: 'standard' },
      { id: 'strat-dir', source: 'STRAT', target: 'DIR', linkType: 'standard' },

      { id: 'soci-sm', source: 'SOCI', target: 'SM_S', linkType: 'standard' },
      { id: 'soci-ceo', source: 'SOCI', target: 'CEO_S', linkType: 'standard' },

      { id: 'sgi-rsgi', source: 'SGI', target: 'RSGI', linkType: 'standard' },
      { id: 'rsgi-msgi1', source: 'RSGI', target: 'MSGI1', linkType: 'standard' },
      { id: 'msgi1-msgi2', source: 'MSGI1', target: 'MSGI2', linkType: 'standard' },

      { id: 'cg-bc', source: 'CG', target: 'BC', linkType: 'standard' },
      { id: 'bc-ja', source: 'BC', target: 'JA', linkType: 'standard' },

      { id: 'pdg-rdi', source: 'PDG', target: 'RDI', linkType: 'standard' },
      { id: 'rdi-mdiv1', source: 'RDI', target: 'MDIV1', linkType: 'standard' },
      { id: 'rdi-mdiv2', source: 'RDI', target: 'MDIV2', linkType: 'standard' },
      { id: 'rdi-pdg_bas', source: 'RDI', target: 'PDG_BAS', linkType: 'standard' },

      { id: 'hr-hrm', source: 'HR', target: 'HRM', linkType: 'standard' },
      { id: 'hrm-cho', source: 'HRM', target: 'CHO', linkType: 'standard' },
      { id: 'hrm-payroll', source: 'HRM', target: 'PAYROLL', linkType: 'standard' },
      { id: 'hrm-recruiter', source: 'HRM', target: 'RECRUITER', linkType: 'standard' },
      { id: 'hrm-gpgs', source: 'HRM', target: 'GPGS', linkType: 'standard' },

      { id: 'dir-ceo_dir', source: 'DIR', target: 'CEO_DIR', linkType: 'standard' },
    ]
  },
  {
    id: 'core',
    key: 'CORE',
    title: 'Processi Core',
    description: 'Post Vendita, Area Codifiche e Verificatori, Contratti, Vendite e Sviluppo',
    rootNodeId: 'CORE',
    rawMermaid: RAW_MERMAID_CORE,
    nodes: [
      { id: 'CORE', role: 'PROCESSI CORE', person: null, rawLabel: 'PROCESSI CORE', category: 'processo', areaId: 'core' },
      { id: 'PV', role: 'POST VENDITA', person: null, rawLabel: 'POST<br>VENDITA', category: 'reparto', areaId: 'core' },
      { id: 'MASTER', role: 'AREA CODIFICHE E VERIFICATORI', person: null, rawLabel: 'AREA CODIFICHE E VERIFICATORI', category: 'reparto', areaId: 'core' },
      { id: 'CONTRATTI', role: 'CONTRATTI', person: null, rawLabel: 'CONTRATTI', category: 'reparto', areaId: 'core' },
      { id: 'VENDITE', role: 'VENDITE', person: null, rawLabel: 'VENDITE', category: 'reparto', areaId: 'core' },
      { id: 'SVILUPPO', role: 'SVILUPPO', person: null, rawLabel: 'SVILUPPO', category: 'reparto', areaId: 'core' },

      // Post Vendita
      { id: 'TSS_PV', role: 'Technical Support Specialist & Service Manager', person: 'Francesco Mantella', rawLabel: 'Technical Support Specialist & Service Manager<br>(Francesco Mantella)', category: 'responsabile', areaId: 'core', departmentId: 'PV' },
      { id: 'TSS1', role: 'Technical Support Specialist', person: 'Giuseppe Armento', rawLabel: 'Technical Support Specialist<br>(Giuseppe Armento)', category: 'membro', areaId: 'core', departmentId: 'PV' },
      { id: 'CSS', role: 'Customer Service Support', person: 'Marina Raineri', rawLabel: 'Customer Service Support<br>(Marina Raineri)', category: 'membro', areaId: 'core', departmentId: 'PV' },
      { id: 'TSS2', role: 'Technical Support Specialist', person: 'Matteo Pagano', rawLabel: 'Technical Support Specialist<br>(Matteo Pagano)', category: 'membro', areaId: 'core', departmentId: 'PV' },
      { id: 'TSS3', role: 'Technical Support Specialist', person: 'Ibrahim Thiaw', rawLabel: 'Technical Support Specialist<br>(Ibrahim Thiaw)', category: 'membro', areaId: 'core', departmentId: 'PV' },

      // Area Codifiche e Verificatori & Backup
      { id: 'BUM', role: 'BU Manager - Area Codifiche e Verificatori', person: "Luca D'Amico", rawLabel: "BU Manager - Area Codifiche e Verificatori<br>(Luca D'Amico)", category: 'responsabile', areaId: 'core', departmentId: 'MASTER', shape: 'rect' },
      { id: 'TSS_COD', role: 'Technical Support Specialist Area Codifiche e Verificatori', person: 'Nino Mazzoni', rawLabel: 'Technical Support Specialist<br>Area Codifiche e Verificatori<br>(Nino Mazzoni)', category: 'membro', areaId: 'core', departmentId: 'MASTER' },
      { id: 'BACKUP_THIAW', role: 'Technical Support Specialist (Backup)', person: 'Ibrahim Thiaw', rawLabel: 'Technical Support Specialist<br>(Ibrahim Thiaw)', category: 'backup', areaId: 'core', departmentId: 'MASTER' },

      // Contratti
      { id: 'CSM', role: 'Contracts & Service Manager', person: 'Irene Castelli', rawLabel: 'Contracts & Service Manager (Irene Castelli)', category: 'responsabile', areaId: 'core', departmentId: 'CONTRATTI' },
      { id: 'CSS_CONTR', role: 'Contracts & Service Specialist', person: 'Stefania Polidoro', rawLabel: 'Contracts & Service Specialist<br>(Stefania Polidoro)', category: 'membro', areaId: 'core', departmentId: 'CONTRATTI' },

      // Vendite
      { id: 'SM', role: 'Sales Manager & Key Account Manager', person: 'Stefano Parisini', rawLabel: 'Sales Manager & Key Account Manager<br>(Stefano Parisini)', category: 'responsabile', areaId: 'core', departmentId: 'VENDITE' },
      { id: 'AM1', role: 'BU Manager - Area Sviluppo', person: 'Alessandro Tartari', rawLabel: 'BU Manager - Area Sviluppo (Alessandro Tartari)', category: 'membro', areaId: 'core', departmentId: 'VENDITE' },
      { id: 'SA', role: 'Sales Account', person: 'Valentina Casalegno', rawLabel: 'Sales Account<br>(Valentina Casalegno)', category: 'membro', areaId: 'core', departmentId: 'VENDITE' },
      { id: 'SPS', role: 'Sales Product Specialist - Materiali di consumo', person: 'Patrizia Merli', rawLabel: 'Sales Product Specialist - Materiali di consumo<br>(Patrizia Merli)', category: 'membro', areaId: 'core', departmentId: 'VENDITE' },
      { id: 'AM2', role: 'Area Manager', person: 'Manuel Massaccesi', rawLabel: 'Area Manager<br>(Manuel Massaccesi)', category: 'membro', areaId: 'core', departmentId: 'VENDITE' },
      { id: 'IS', role: 'Internal Sales', person: 'Roberta Vigorelli', rawLabel: 'Internal Sales<br>(Roberta Vigorelli)', category: 'membro', areaId: 'core', departmentId: 'VENDITE' },
      { id: 'AM3', role: 'Area Manager (Agente Monomandatario)', person: 'Danilo Rossoni', details: 'Agente Monomandatario', rawLabel: 'Area Manager<br>(Danilo Rossoni, Agente Monomandatario)', category: 'membro', areaId: 'core', departmentId: 'VENDITE' },

      // Sviluppo
      { id: 'PM', role: 'Project Manager - Print Apply e Software', person: 'Stefano Selleri', rawLabel: 'Project Manager - Print Apply e Software<br>(Stefano Selleri)', category: 'responsabile', areaId: 'core', departmentId: 'SVILUPPO' },
      { id: 'SE', role: 'Software Engineer (Collaboratore)', person: 'Gabriele Tassoni', details: 'Collaboratore', rawLabel: 'Software Engineer<br>(Gabriele Tassoni, Collaboratore)', category: 'membro', areaId: 'core', departmentId: 'SVILUPPO' },
      { id: 'SD1', role: 'Software Developer', person: 'Gianluca Gabriele', rawLabel: 'Software Developer<br>(Gianluca Gabriele)', category: 'membro', areaId: 'core', departmentId: 'SVILUPPO' },
      { id: 'TSS_SV', role: 'Technical Support Specialist', person: 'Simone Torrisi', rawLabel: 'Technical Support Specialist<br>(Simone Torrisi)', category: 'membro', areaId: 'core', departmentId: 'SVILUPPO' },
      { id: 'SD2', role: 'Software Developer', person: 'Santiago Galvan Colorado', rawLabel: 'Software Developer<br>(Santiago Galvan Colorado)', category: 'membro', areaId: 'core', departmentId: 'SVILUPPO' },
      { id: 'PA', role: 'Project Assistant - Print Apply e Software (Collaboratore)', person: 'Riccardo Basaglia', details: 'Collaboratore', rawLabel: 'Project Assistant - Print Apply e Software<br>(Riccardo Basaglia, Collaboratore)', category: 'membro', areaId: 'core', departmentId: 'SVILUPPO' },
    ],
    links: [
      { id: 'core-pv', source: 'CORE', target: 'PV', linkType: 'standard' },
      { id: 'core-master', source: 'CORE', target: 'MASTER', linkType: 'standard' },
      { id: 'core-contratti', source: 'CORE', target: 'CONTRATTI', linkType: 'standard' },
      { id: 'core-vendite', source: 'CORE', target: 'VENDITE', linkType: 'standard' },
      { id: 'core-sviluppo', source: 'CORE', target: 'SVILUPPO', linkType: 'standard' },

      { id: 'pv-tss_pv', source: 'PV', target: 'TSS_PV', linkType: 'standard' },
      { id: 'tss_pv-tss1', source: 'TSS_PV', target: 'TSS1', linkType: 'standard' },
      { id: 'tss_pv-css', source: 'TSS_PV', target: 'CSS', linkType: 'standard' },
      { id: 'tss_pv-tss2', source: 'TSS_PV', target: 'TSS2', linkType: 'standard' },
      { id: 'tss_pv-tss3', source: 'TSS_PV', target: 'TSS3', linkType: 'standard' },

      { id: 'master-bum', source: 'MASTER', target: 'BUM', linkType: 'standard' },
      { id: 'bum-tss_cod', source: 'BUM', target: 'TSS_COD', linkType: 'standard' },
      { id: 'tss_cod-backup', source: 'TSS_COD', target: 'BACKUP_THIAW', linkType: 'backup', label: 'backup' },

      { id: 'contr-csm', source: 'CONTRATTI', target: 'CSM', linkType: 'standard' },
      { id: 'csm-css_contr', source: 'CSM', target: 'CSS_CONTR', linkType: 'standard' },

      { id: 'vend-sm', source: 'VENDITE', target: 'SM', linkType: 'standard' },
      { id: 'vend-am1', source: 'VENDITE', target: 'AM1', linkType: 'standard' },
      { id: 'sm-sa', source: 'SM', target: 'SA', linkType: 'standard' },
      { id: 'sm-sps', source: 'SM', target: 'SPS', linkType: 'standard' },
      { id: 'sm-am2', source: 'SM', target: 'AM2', linkType: 'standard' },
      { id: 'sm-is', source: 'SM', target: 'IS', linkType: 'standard' },
      { id: 'sm-am3', source: 'SM', target: 'AM3', linkType: 'standard' },

      { id: 'svil-pm', source: 'SVILUPPO', target: 'PM', linkType: 'standard' },
      { id: 'pm-se', source: 'PM', target: 'SE', linkType: 'standard' },
      { id: 'pm-sd1', source: 'PM', target: 'SD1', linkType: 'standard' },
      { id: 'pm-tss_sv', source: 'PM', target: 'TSS_SV', linkType: 'standard' },
      { id: 'pm-sd2', source: 'PM', target: 'SD2', linkType: 'standard' },
      { id: 'pm-pa', source: 'PM', target: 'PA', linkType: 'standard' },
    ]
  }
];

export const CATEGORY_STYLES: Record<
  string,
  {
    bgLight: string;
    borderLight: string;
    textLight: string;
    bgDark: string;
    borderDark: string;
    textDark: string;
    badgeLight: string;
    badgeDark: string;
    label: string;
    mermaidFill: string;
    mermaidStroke: string;
  }
> = {
  processo: {
    bgLight: 'bg-purple-100/90',
    borderLight: 'border-purple-300',
    textLight: 'text-purple-950',
    bgDark: 'dark:bg-purple-950/60',
    borderDark: 'dark:border-purple-700/60',
    textDark: 'dark:text-purple-100',
    badgeLight: 'bg-purple-200 text-purple-900',
    badgeDark: 'dark:bg-purple-900/70 dark:text-purple-200',
    label: 'Processo',
    mermaidFill: '#e1d5e7',
    mermaidStroke: '#9673a6'
  },
  reparto: {
    bgLight: 'bg-rose-50/90',
    borderLight: 'border-rose-300',
    textLight: 'text-rose-950',
    bgDark: 'dark:bg-rose-950/50',
    borderDark: 'dark:border-rose-700/60',
    textDark: 'dark:text-rose-100',
    badgeLight: 'bg-rose-100 text-rose-800',
    badgeDark: 'dark:bg-rose-900/60 dark:text-rose-200',
    label: 'Reparto / Unità',
    mermaidFill: '#f8cecc',
    mermaidStroke: '#b85450'
  },
  responsabile: {
    bgLight: 'bg-amber-50/90',
    borderLight: 'border-amber-400',
    textLight: 'text-amber-950',
    bgDark: 'dark:bg-amber-950/50',
    borderDark: 'dark:border-amber-600/70',
    textDark: 'dark:text-amber-100',
    badgeLight: 'bg-amber-200 text-amber-900',
    badgeDark: 'dark:bg-amber-900/70 dark:text-amber-200',
    label: 'Responsabile',
    mermaidFill: '#ffe6cc',
    mermaidStroke: '#d79b00'
  },
  membro: {
    bgLight: 'bg-yellow-50/90',
    borderLight: 'border-yellow-300',
    textLight: 'text-yellow-950',
    bgDark: 'dark:bg-yellow-950/40',
    borderDark: 'dark:border-yellow-700/50',
    textDark: 'dark:text-yellow-100',
    badgeLight: 'bg-yellow-100 text-yellow-900',
    badgeDark: 'dark:bg-yellow-900/60 dark:text-yellow-200',
    label: 'Membro',
    mermaidFill: '#fff2cc',
    mermaidStroke: '#d6b656'
  },
  backup: {
    bgLight: 'bg-slate-100/90 border-dashed',
    borderLight: 'border-slate-400',
    textLight: 'text-slate-800',
    bgDark: 'dark:bg-slate-900/60 dark:border-dashed',
    borderDark: 'dark:border-slate-600',
    textDark: 'dark:text-slate-200',
    badgeLight: 'bg-slate-200 text-slate-700',
    badgeDark: 'dark:bg-slate-800 dark:text-slate-300',
    label: 'Ruolo di Backup',
    mermaidFill: '#f5f5f5',
    mermaidStroke: '#666666'
  }
};
