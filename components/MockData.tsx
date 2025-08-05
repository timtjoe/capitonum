import { IArticle } from "./Masonry";

// Mock Data
export const MockData: IArticle[] = [
  {
    id: "1",
    // Assumes an image named s_1.webp exists in your assets folder
    imageUrl: require("@/assets/samples/s_1.webp"),
    body: "The United States operated a nuclear reactor in Antarctica to reduce the need for fossil fuels. It operated for less than 10 years and its large crew, clean up costs and unreliability led to its early decommissioning.",
  },
  {
    id: "2",
    imageUrl: require("@/assets/samples/s_2.webp"),
    body: "The Disney character Pete is a cat",
  },
  {
    id: "3",
    // This article does not have an image
    body: "That in Japan, it is common practice among married couples for the woman to fully control the couple's finances. The husbands' hand over their monthly pay and receive an allowance from their wives.",
  },
  {
    id: "4",
    imageUrl: require("@/assets/samples/s_4.webp"),
    body: "Grigori Perelman was offered the Fields Medal in 2006 and the Millennium Prize of 1 million dollars in 2010 for his contribution in solving the Poincaré Conjecture, an open problem in mathematics for a century. He rejected both of them.",
  },
  {
    id: "5",
    imageUrl: require("@/assets/samples/s_5.webp"),
    body: "That Kansas banned public bars until 1986.",
  },
  {
    id: "6",
    imageUrl: require("@/assets/samples/s_6.webp"),
    body: "In 1338, Scottish countess Agnes of Dunbar led the successful defense of Dunbar Castle during a 5-month siege by a much larger English army. At one point, they threatened to kill her captured brother if she didn't surrender. She replied that his death would only benefit her as she was his heir.",
  },
  {
    id: "7",
    imageUrl: require("@/assets/samples/s_7.webp"),
    body: "That nearly 40% of all people suffer from cancer in their lifetime.",
  },
  {
    id: "8",
    body: "The TV show Scrubs was filmed in the North Hollywood Medical Center, using the entire decommissioned hospital. All of the writers also worked inside it, and it had an editing suite and a sound-studio for post-production. And instead of trailers for the cast, they were given old hospital rooms.",
  },
  {
    id: "9",
    imageUrl: require("@/assets/samples/s_9.webp"),
    body: "In parts of rural China, humans are doing the work bees once did.",
  },
  {
    id: "10",
    imageUrl: require("@/assets/samples/s_10.webp"),
    body: "That Sor Juana Inés de la Cruz (1651–1695) was a Mexican nun, writer, philosopher, composer, and poet nicknamed “The Tenth Muse” and “The Mexican Phoenix.” She corresponded with Isaac Newton, studied science, and is considered one of the most important female writers in Mexican literature.",
  },
  {
    id: "11",
    body: "That Pierce Brosnan was not allowed to wear a tuxedo in other films while he was under contract for the James Bond franchise. This is partially why he shows up to a black-and-white ball with an unbuttoned dress shirt and untied bow in The Thomas Crown Affair (1999).",
  },
];
