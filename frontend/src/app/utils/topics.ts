export const STORY_TOPICS = [
  "The Lost Key",
  "A Message from the Future",
  "The Day the Internet Stopped",
  "The Secret in the Attic",
  "A Stranger on the Train",
  "The Last Tree on Earth",
  "The Invisible Man",
  "The Clock that Ran Backwards",
  "The Door to Nowhere",
  "The Whispering Forest",
  "The Man Who Could Fly",
  "The Girl Who Remembered Everything",
  "The Robot Who Wanted to Love",
  "The City Under the Sea",
  "The Island of Lost Dreams",
  "The Book that Wrote Itself",
  "The Cat Who Could Talk",
  "The Mirror of Truth",
  "The Shop of Forgotten Things",
  "The Train to Yesterday"
];

export function getDailyTopic(date: Date = new Date()): string {
  // Create a seed from the date (YYYY-MM-DD)
  const dateStr = date.toISOString().split('T')[0];
  
  // Simple hash function to get a number from the string
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = ((hash << 5) - hash) + dateStr.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  
  // Use absolute value of hash
  const index = Math.abs(hash) % STORY_TOPICS.length;
  return STORY_TOPICS[index];
}

export function getTopicTag(date: Date = new Date()): string {
  return `DailyTopic:${date.toISOString().split('T')[0]}`;
}
