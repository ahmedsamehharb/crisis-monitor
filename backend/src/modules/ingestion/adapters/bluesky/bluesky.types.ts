export interface BlueskyAuthor {
  handle: string;
  displayName?: string;
}

export interface BlueskyPostRecord {
  text?: string;
  createdAt?: string;
}

export interface BlueskyPost {
  uri: string;
  author: BlueskyAuthor;
  record: BlueskyPostRecord;
}

export interface BlueskySearchResponse {
  posts?: BlueskyPost[];
}
