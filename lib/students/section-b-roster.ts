export type StudentSeed = {
  name: string;
  usn: string;
  section: string;
  email: string;
};

/** MCA 1st year — Section B */
const raw = [
  { name: "Muhammed Fadhi T", usn: "1BM25MC059", section: "B" },
  { name: "Muttanna Sharanappa Yalaburti", usn: "1BM25MC060", section: "B" },
  { name: "Navaneeth Gowda G", usn: "1BM25MC061", section: "B" },
  { name: "P S Sai Rakshitha", usn: "1BM25MC062", section: "B" },
  { name: "Padmaja Ningappa Bill", usn: "1BM25MC063", section: "B" },
  { name: "Pavan R Shetty", usn: "1BM25MC064", section: "B" },
  { name: "Piyush Kumar Ramanand Soni", usn: "1BM25MC065", section: "B" },
  { name: "Prajesh L D", usn: "1BM25MC066", section: "B" },
  { name: "Prarthana Shetty", usn: "1BM25MC067", section: "B" },
  { name: "Prathviraj Sagar", usn: "1BM25MC068", section: "B" },
  { name: "Puttamma M", usn: "1BM25MC069", section: "B" },
  { name: "Rahul S M", usn: "1BM25MC070", section: "B" },
  { name: "Raihaan Ismail Jukaku", usn: "1BM25MC071", section: "B" },
  { name: "Rakshith Gowda P", usn: "1BM25MC072", section: "B" },
  { name: "Rakshitha Maiya S", usn: "1BM25MC073", section: "B" },
  { name: "Rishon Raymond Barnes", usn: "1BM25MC074", section: "B" },
  { name: "Rukkaiya Burhanuddin", usn: "1BM25MC075", section: "B" },
  { name: "S P Vijayraj", usn: "1BM25MC076", section: "B" },
  { name: "Sahishnu Jogur", usn: "1BM25MC077", section: "B" },
  { name: "Sai Kumar", usn: "1BM25MC078", section: "B" },
  { name: "Samartha H G", usn: "1BM25MC079", section: "B" },
  { name: "Sandeepa N R", usn: "1BM25MC080", section: "B" },
  { name: "Sarvasetty Varshitha", usn: "1BM25MC081", section: "B" },
  { name: "Sathwik G", usn: "1BM25MC082", section: "B" },
  { name: "Shaheentaj M", usn: "1BM25MC083", section: "B" },
  { name: "Shamanth Kodgi M M", usn: "1BM25MC084", section: "B" },
  { name: "Sharanya M P", usn: "1BM25MC085", section: "B" },
  { name: "Shravan S Babu I N", usn: "1BM25MC086", section: "B" },
  { name: "Shree Raksha R", usn: "1BM25MC087", section: "B" },
  { name: "Shrilaxmi Heralagi", usn: "1BM25MC088", section: "B" },
  { name: "Sneha H", usn: "1BM25MC089", section: "B" },
  { name: "Sneha M N", usn: "1BM25MC090", section: "B" },
  { name: "Sneha Uday Naik", usn: "1BM25MC091", section: "B" },
  { name: "Srivatsa S", usn: "1BM25MC092", section: "B" },
  { name: "Srujan J K", usn: "1BM25MC093", section: "B" },
  { name: "Suhas E", usn: "1BM25MC095", section: "B" },
  { name: "Suhas S R", usn: "1BM25MC096", section: "B" },
  { name: "Tanish G", usn: "1BM25MC097", section: "B" },
  { name: "Tanusha Avinash", usn: "1BM25MC098", section: "B" },
  { name: "Tarun G", usn: "1BM25MC099", section: "B" },
  { name: "Tarun P", usn: "1BM25MC100", section: "B" },
  { name: "Tarun S U", usn: "1BM25MC101", section: "B" },
  { name: "Tejdeep B N", usn: "1BM25MC102", section: "B" },
  { name: "Usmanul Afwan D K", usn: "1BM25MC103", section: "B" },
  { name: "Varun M K", usn: "1BM25MC104", section: "B" },
  { name: "Vighnesh Nayak", usn: "1BM25MC105", section: "B" },
  { name: "Vijayalaxmi Hadimani", usn: "1BM25MC106", section: "B" },
  { name: "Vijeth V V", usn: "1BM25MC107", section: "B" },
  { name: "Vishruth T S", usn: "1BM25MC109", section: "B" },
  { name: "Vishwa Moorthy S", usn: "1BM25MC110", section: "B" },
  { name: "Vittal Satteppa Kempasatti", usn: "1BM25MC111", section: "B" },
  { name: "Yashash M", usn: "1BM25MC112", section: "B" },
  { name: "Dhiraj Kumar Ray", usn: "1BM25MC113", section: "B" },
  { name: "Prashant Kumar Thakur", usn: "1BM25MC114", section: "B" },
  { name: "Shreya Karn", usn: "1BM25MC115", section: "B" },
] as const;

export const ACTIVITY_COORDINATOR_USNS = [
  "1BM25MC078",
  "1BM25MC080",
  "1BM25MC114",
  "1BM25MC102",
  "1BM25MC100",
  "1BM25MC097",
  "1BM25MC075",
] as const;

const coordinatorSet = new Set<string>(ACTIVITY_COORDINATOR_USNS);

export function isActivityCoordinator(usn: string): boolean {
  return coordinatorSet.has(usn.toUpperCase());
}

export const SECTION_B_STUDENTS: StudentSeed[] = raw.map((s) => ({
  ...s,
  email: `${s.usn.toLowerCase()}@bmsce.ac.in`,
}));
