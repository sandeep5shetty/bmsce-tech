export interface ElectiveCatalogEntry {
  code: string;
  title: string;
}

/**
 * MCA elective course catalog (code + title), used to quickly prefill poll
 * options when creating an elective-selection poll. Add new offerings here
 * as they're announced — no other code change needed, the "Add from
 * catalog" picker in the poll creation form reads straight from this list.
 */
export const MCA_ELECTIVE_CATALOG: ElectiveCatalogEntry[] = [
  { code: "MMCE30B1", title: "Advanced Topics in AI" },
  { code: "MMCE30B2", title: "Cyber Security" },
  { code: "MMCE30B3", title: "DevOps" },
  { code: "MMCE30B4", title: "UI/UX" },
  { code: "MMCE30B5", title: "Web of Things" },
  {
    code: "MMCE30B6",
    title: "Introduction to Agentic AI - Industry Driven Course",
  },
  { code: "MMCE30C1", title: "Introduction to Block Chain Technologies" },
  { code: "MMCE30C2", title: "Robotics" },
  { code: "MMCE30C3", title: "Soft Computing" },
  { code: "MMCE30C4", title: "Advanced Java Programming" },
  { code: "MMCE30C5", title: "Mobile Application Development" },
];
