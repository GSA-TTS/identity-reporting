interface Release {
  name: string;
  createdAt: Date;
  tagName: string;
}

interface ApiRelease {
  name: string;
  created_at: string;
  tag_name: string;
}

function loadReleases({ owner, repo }: { owner: string; repo: string }): Promise<Release[]> {
  return fetch(`https://api.github.com/repos/${owner}/${repo}/releases`)
    .then((response) => response.json())
    .then((releases: ApiRelease[]) =>
      releases.map(({ name, created_at: createdAt, tag_name: tagName }) => {
        return { name, createdAt: new Date(createdAt), tagName };
      })
    );
}

export { loadReleases };
