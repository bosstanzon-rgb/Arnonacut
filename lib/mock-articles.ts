import type { Article } from "./types";

/**
 * Illustrative English headlines for local development.
 * Not live reporting. Replace with a Supabase query later.
 */
export const MOCK_ARTICLES: Article[] = [
  {
    id: "7c1a9b2e-4d3f-4a11-9c08-1b2e3f4a5b6c",
    headlineEn:
      "IDF says it struck a weapons depot in southern Lebanon after overnight rocket fire",
    summaryEn:
      "The military said aircraft hit a storage site it linked to rocket launches toward northern Israel. Sirens sounded in several Galilee communities. Lebanese media reported explosions near Tyre. No Israeli casualties were confirmed at the time of this summary.",
    sourceName: "The Times of Israel",
    originalPublishedAt: "2026-10-05T20:42:00.000Z",
    category: "Security",
    importance: "BREAKING",
    originalUrl: "https://www.timesofisrael.com/example-lebanon-strike",
  },
  {
    id: "a12f0c44-88b1-4e90-9d77-2c3d4e5f6a7b",
    headlineEn:
      "Cabinet holds late-night session on hostage talks and Gaza crossing hours",
    summaryEn:
      "Ministers met after mediators circulated a revised timetable for humanitarian access. Officials said no final deal was approved. A short statement promised another update after consultations with security chiefs and the negotiating team in Cairo.",
    sourceName: "Kan News",
    originalPublishedAt: "2026-10-05T19:15:00.000Z",
    category: "Politics",
    importance: "MAJOR",
    originalUrl: "https://www.kan.org.il/example-cabinet-session",
  },
  {
    id: "b23e1d55-99c2-4f01-8e88-3d4e5f6a7b8c",
    headlineEn:
      "Bank of Israel holds rate steady as shekel firms against the dollar",
    summaryEn:
      "The central bank left its key rate unchanged, citing cooler inflation and a stronger shekel. Governor comments pointed to housing costs still running hot. Markets had widely expected a pause. Mortgage rates are likely to stay elevated in the near term.",
    sourceName: "Globes",
    originalPublishedAt: "2026-10-05T16:05:00.000Z",
    category: "Economy",
    importance: "MAJOR",
    originalUrl: "https://www.globes.co.il/example-rate-decision",
  },
  {
    id: "c34f2e66-00d3-4012-9f99-4e5f6a7b8c9d",
    headlineEn:
      "Jerusalem light rail extension reopens after weekend signal fault",
    summaryEn:
      "Service on the Red Line resumed this morning after a signaling outage halted trains on Saturday. City Hall said engineers replaced a control unit near French Hill. Peak-hour crowding is expected while delayed passengers return to the regular timetable.",
    sourceName: "The Jerusalem Post",
    originalPublishedAt: "2026-10-05T14:28:00.000Z",
    category: "Israel",
    importance: "UPDATE",
    originalUrl: "https://www.jpost.com/example-light-rail",
  },
  {
    id: "d45a3f77-11e4-4123-8a00-5f6a7b8c9d0e",
    headlineEn:
      "Haifa port workers pause strike after overnight wage talks",
    summaryEn:
      "Dockworkers ended a short work stoppage after unions and the ports company agreed to resume negotiations. Shipping agents said several container ships waited offshore. A follow-up meeting is scheduled for Thursday. Passenger traffic was not affected.",
    sourceName: "Ynet",
    originalPublishedAt: "2026-10-05T12:50:00.000Z",
    category: "Economy",
    importance: "UPDATE",
    originalUrl: "https://www.ynetnews.com/example-haifa-port",
  },
  {
    id: "e56b4088-22f5-4234-9b11-6a7b8c9d0e1f",
    headlineEn:
      "Tel Aviv hospital opens new pediatric emergency wing after two-year build",
    summaryEn:
      "Ichilov inaugurated a dedicated children’s emergency unit meant to cut wait times. Officials said the floor adds triage rooms and overnight observation beds. Staffing is still ramping up. Visiting hours remain limited while teams complete training drills this week.",
    sourceName: "Haaretz",
    originalPublishedAt: "2026-10-05T11:10:00.000Z",
    category: "Society",
    importance: "OTHER",
    originalUrl: "https://www.haaretz.com/example-pediatric-wing",
  },
  {
    id: "f67c5199-3306-4345-8c22-7b8c9d0e1f20",
    headlineEn:
      "Cyber authority warns of phishing wave aimed at government email accounts",
    summaryEn:
      "The Israel National Cyber Directorate said spoofed login pages are targeting civil servants. Recipients were told to ignore messages about password expiry. No confirmed breach of core systems was reported. Agencies were asked to enforce extra verification on remote access.",
    sourceName: "i24NEWS",
    originalPublishedAt: "2026-10-05T09:40:00.000Z",
    category: "Technology",
    importance: "MAJOR",
    originalUrl: "https://www.i24news.tv/example-phishing-warning",
  },
  {
    id: "078d62aa-4417-4456-9d33-8c9d0e1f2031",
    headlineEn:
      "UN Security Council schedules briefing on Lebanon border tensions",
    summaryEn:
      "Diplomats said a closed-door session will hear updates from the UNIFIL command. Israel and Lebanon are both expected to submit notes. Washington urged restraint along the Blue Line. No draft resolution was circulated before the meeting notice went out.",
    sourceName: "Reuters",
    originalPublishedAt: "2026-10-05T08:05:00.000Z",
    category: "International",
    importance: "UPDATE",
    originalUrl: "https://www.reuters.com/example-unsc-lebanon",
  },
  {
    id: "189e73bb-5528-4567-8e44-9d0e1f203142",
    headlineEn:
      "Knesset committee advances bill on wartime reserve compensation",
    summaryEn:
      "The Finance Committee approved a draft that would extend stipends for reservists called up more than 30 days. Coalition and opposition members backed the outline, with disputes over small-business grants. A first reading is expected later this month if the text is finalized.",
    sourceName: "Channel 12",
    originalPublishedAt: "2026-10-04T21:18:00.000Z",
    category: "Politics",
    importance: "OTHER",
    originalUrl: "https://www.mako.co.il/example-reserve-bill",
  },
  {
    id: "29af84cc-6639-4678-9f55-0e1f20314253",
    headlineEn:
      "Beersheba students return after rocket alert closes campus overnight",
    summaryEn:
      "Ben-Gurion University reopened classrooms this morning following a late alert that sent dorm residents to shelters. Police said there was no impact on campus. Counseling staff were available at the student center. Evening classes will run as scheduled.",
    sourceName: "The Times of Israel",
    originalPublishedAt: "2026-10-04T18:44:00.000Z",
    category: "Society",
    importance: "UPDATE",
    originalUrl: "https://www.timesofisrael.com/example-bgu-reopen",
  },
  {
    id: "3ab095dd-774a-4789-8066-1f2031425364",
    headlineEn:
      "Israeli startup raises $40 million for satellite imaging analytics",
    summaryEn:
      "A Herzliya firm said a Series B round will fund a new processing center and U.S. sales staff. Investors include two local growth funds. The company sells change-detection tools to insurers and agriculture clients. It declined to name government customers.",
    sourceName: "Calcalist",
    originalPublishedAt: "2026-10-04T15:02:00.000Z",
    category: "Technology",
    importance: "OTHER",
    originalUrl: "https://www.calcalistech.com/example-sat-funding",
  },
  {
    id: "4bc1a6ee-885b-4890-9177-203142536475",
    headlineEn:
      "Heavy rain floods underpass on Ayalon Highway; lanes reopen at dawn",
    summaryEn:
      "Overnight storms left standing water on a southbound underpass near the Hashalom interchange. Police diverted traffic until pumps cleared the road. No serious injuries were reported. Forecasters expect another band of rain this evening across the coastal plain.",
    sourceName: "N12",
    originalPublishedAt: "2026-10-04T05:33:00.000Z",
    category: "Israel",
    importance: "OTHER",
    originalUrl: "https://www.n12.co.il/example-ayalon-flood",
  },
  {
    id: "5cd2b7ff-996c-4901-8288-314253647586",
    headlineEn:
      "Washington envoy meets Israeli officials on Red Sea shipping security",
    summaryEn:
      "A visiting U.S. diplomat discussed convoy coordination and insurance costs after recent attacks on commercial traffic. Israeli officials restated a preference for multinational patrols. No new naval deployment was announced. A joint statement is possible later this week.",
    sourceName: "The Jerusalem Post",
    originalPublishedAt: "2026-10-03T22:11:00.000Z",
    category: "International",
    importance: "MAJOR",
    originalUrl: "https://www.jpost.com/example-red-sea-talks",
  },
  {
    id: "6de3c800-aa7d-4012-9399-425364758697",
    headlineEn:
      "Galilee farmers warn of labor shortage ahead of olive harvest",
    summaryEn:
      "Growers in the north said permit delays and security restrictions could leave fruit unpicked. Agriculture Ministry staff visited groves near the border. A limited seasonal-worker allotment is under review. Prices for early-season oil may rise if yields fall.",
    sourceName: "Haaretz",
    originalPublishedAt: "2026-10-03T13:20:00.000Z",
    category: "Society",
    importance: "OTHER",
    originalUrl: "https://www.haaretz.com/example-olive-harvest",
  },
];
