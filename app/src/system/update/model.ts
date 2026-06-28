// TODO: Rewrite?

export interface GitHubRelease {
  tag:         string;
  name:        string;
  publishedAt: string;
  prerelease:  boolean;
  body:        string;
}

export interface GitHubBranch {
  name: string;
}

export interface UpdateStatus {
  current:     string;
  releases:    GitHubRelease[];
  branches:    GitHubBranch[];
  lastChecked: number | null;
  updating:    boolean;
  updateError: string | null;
  hasUpdate:   boolean;
}
