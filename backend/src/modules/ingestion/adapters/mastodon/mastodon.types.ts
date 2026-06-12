export interface MastodonAccount {
  username?: string;
  display_name?: string;
}

export interface MastodonStatus {
  id: string;
  content?: string;
  url?: string;
  created_at?: string;
  account?: MastodonAccount;
  reblog?: MastodonStatus | null;
}

export interface MastodonSearchResponse {
  statuses?: MastodonStatus[];
}
