import type { SourceAuditPlan } from "./schema.js";

export function createDefaultSourceAuditPlan(generatedAt = new Date().toISOString()): SourceAuditPlan {
  return {
    version: 1,
    generatedAt,
    collectionPolicy: {
      textOnly: true,
      allowImages: false,
      allowOtherMedia: false,
      allowManualReviewReferences: true,
      allowAutomatedManualReviewSources: false,
      allowDisallowedSourceCapture: false
    },
    sources: [
      {
        sourceSite: "topdeck",
        role: "backbone",
        usePolicy: "approved",
        summary: "Primary green-source event metadata target for Stage 1 public collection.",
        auditNotes: [
          "Capture HTML/text only. Never download linked images or other media assets.",
          "Treat public event registration/result pages as approved event metadata sources when they are accessible without bypassing technical restrictions."
        ],
        targets: [
          {
            id: "topdeck-event-sample",
            sourceSite: "topdeck",
            label: "TopDeck public event page sample",
            url: "https://topdeck.gg/event/pro-play-summit-pittsburgh-tournament-1",
            captureKind: "event-detail",
            usePolicy: "approved",
            notes: ["Validate public event metadata fields and confirm the page remains accessible without a login or anti-bot workarounds."],
            enabled: true,
            status: "pending",
            relativePath: null,
            capturedAt: null,
            lastError: null,
            lastByteLength: null,
            lastContentType: null
          }
        ]
      },
      {
        sourceSite: "organizer",
        role: "supplemental",
        usePolicy: "approved",
        summary: "Direct organizer pages for public event facts and source-of-truth links.",
        auditNotes: [
          "Prefer organizer pages when they expose event details publicly.",
          "Do not treat marketing pages or inaccessible deck portals as approved sources until the content is actually public and collectible."
        ],
        targets: [
          {
            id: "ccs-qualifier-event-sample",
            sourceSite: "organizer",
            label: "Organizer event page sample",
            url: "https://ccs-houston.com/events/ccs-riftbound-25000-invitational-qualifier-1/",
            captureKind: "event-detail",
            usePolicy: "approved",
            notes: ["Validate organizer-hosted event metadata and outbound registration links."],
            enabled: true,
            status: "pending",
            relativePath: null,
            capturedAt: null,
            lastError: null,
            lastByteLength: null,
            lastContentType: null
          }
        ]
      },
      {
        sourceSite: "official-riot",
        role: "supplemental",
        usePolicy: "approved",
        summary: "Official Riot public pages for policy, rules, and event/result context that does not require restricted access.",
        auditNotes: [
          "Official Riot sources are approved for policy/rules/event context, but they are not expected to provide decklists."
        ],
        targets: [
          {
            id: "riot-riftbound-docs-sample",
            sourceSite: "official-riot",
            label: "Riot Riftbound docs sample",
            url: "https://developer.riotgames.com/docs/riftbound",
            captureKind: "meta-report",
            usePolicy: "approved",
            notes: ["Keep a captured policy reference for approved digital-tool boundaries."],
            enabled: true,
            status: "pending",
            relativePath: null,
            capturedAt: null,
            lastError: null,
            lastByteLength: null,
            lastContentType: null
          }
        ]
      },
      {
        sourceSite: "riftdecks",
        role: "manual-reference",
        usePolicy: "manual-review-only",
        summary: "Third-party competitive archive retained only for manual audit and moderator review reference.",
        auditNotes: [
          "Do not automate collection from this source.",
          "Do not use this source as canonical dataset input or as a programmatic validation dependency.",
          "Manual spot checks are allowed only as secondary review aids."
        ],
        targets: [
          {
            id: "riftdecks-reference-homepage",
            sourceSite: "riftdecks",
            label: "RiftDecks reference homepage",
            url: "https://riftdecks.com/",
            captureKind: "meta-report",
            usePolicy: "manual-review-only",
            notes: ["Reference only. Do not capture automatically."],
            enabled: false,
            status: "skipped",
            relativePath: null,
            capturedAt: null,
            lastError: null,
            lastByteLength: null,
            lastContentType: null
          }
        ]
      },
      {
        sourceSite: "riftbound-gg",
        role: "manual-reference",
        usePolicy: "manual-review-only",
        summary: "Editorial/aggregator site used only for manual coverage checks.",
        auditNotes: [
          "Use only as a manual secondary reference, never as automated capture input."
        ],
        targets: [
          {
            id: "riftbound-gg-reference-tournament",
            sourceSite: "riftbound-gg",
            label: "Riftbound.gg tournament page reference",
            url: "https://riftbound.gg/tournaments/ccs-riftbound-25000-riftbound-invitational-qualifier-1/",
            captureKind: "meta-report",
            usePolicy: "manual-review-only",
            notes: ["Reference only. Do not capture automatically."],
            enabled: false,
            status: "skipped",
            relativePath: null,
            capturedAt: null,
            lastError: null,
            lastByteLength: null,
            lastContentType: null
          }
        ]
      },
      {
        sourceSite: "riftrank",
        role: "manual-reference",
        usePolicy: "manual-review-only",
        summary: "Public meta/deck surface retained only for manual comparison if needed.",
        auditNotes: [
          "Do not prioritize or automate collection from this source."
        ],
        targets: [
          {
            id: "riftrank-homepage",
            sourceSite: "riftrank",
            label: "RiftRank homepage",
            url: "https://riftrank.com/",
            captureKind: "meta-report",
            usePolicy: "manual-review-only",
            notes: ["Reference only. Do not capture automatically."],
            enabled: false,
            status: "skipped",
            relativePath: null,
            capturedAt: null,
            lastError: null,
            lastByteLength: null,
            lastContentType: null
          }
        ]
      },
      {
        sourceSite: "riftmanager",
        role: "manual-reference",
        usePolicy: "manual-review-only",
        summary: "Potential ecosystem signal kept only as a manual reference source.",
        auditNotes: [
          "Treat as manual reference only unless a later approved plan identifies public green-source pages."
        ],
        targets: [
          {
            id: "riftmanager-homepage",
            sourceSite: "riftmanager",
            label: "RiftManager homepage",
            url: "https://riftmanager.app/",
            captureKind: "meta-report",
            usePolicy: "manual-review-only",
            notes: ["Reference only. Do not capture automatically."],
            enabled: false,
            status: "skipped",
            relativePath: null,
            capturedAt: null,
            lastError: null,
            lastByteLength: null,
            lastContentType: null
          }
        ]
      }
    ]
  };
}
