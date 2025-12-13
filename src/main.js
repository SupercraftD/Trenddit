import "./style.css";

const REDDIT_BASE = "https://www.reddit.com";
const CORS_PROXY = "https://corsproxy.io/?";
const LIMIT = 100;

// Fetch a single Reddit page via CORS proxy
async function fetchRedditPage(subreddit, time, after = null) {
  const params = new URLSearchParams({ t: time, limit: LIMIT });
  if (after) params.set("after", after);

  const url = `${REDDIT_BASE}/r/${subreddit}/top.json?${params.toString()}`;
  const proxiedUrl = CORS_PROXY + encodeURIComponent(url);

  const res = await fetch(proxiedUrl, {
    headers: {
      "User-Agent": "hackathon-trend-visualizer/1.0"
    }
  });

  if (!res.ok) throw new Error(`Reddit request failed: ${res.status}`);
  return res.json();
}

// Parse Reddit JSON to clean array
function parseRedditListing(json) {
  if (!json?.data?.children) return [];
  return json.data.children.map(({ data }) => ({
    id: data.id,
    title: data.title,
    score: data.score,
    comments: data.num_comments,
    subreddit: data.subreddit,
    author: data.author,
    createdUtc: data.created_utc,
    url: data.permalink ? `https://reddit.com${data.permalink}` : null,
    nsfw: data.over_18
  }));
}

// Fetch all pages for a time window (paginated)
async function fetchRedditAll(subreddit = "all", time = "day", maxPages = 5) {
  let allPosts = [];
  let after = null;

  for (let page = 0; page < maxPages; page++) {
    const json = await fetchRedditPage(subreddit, time, after);
    const posts = parseRedditListing(json);
    if (posts.length === 0) break;

    allPosts.push(...posts);
    after = json.data.after;
    if (!after) break;
  }

  return allPosts;
}

document.getElementById("fetch").addEventListener("click", async () => {
  const output = document.getElementById("output");
  output.textContent = "Fetching";
  let loading = setInterval(() => {
    output.textContent += ".";
    if (output.textContent.length > 20) output.textContent = "Fetching";
  }, 500);
  try {
    const subreddit = "all";
    const posts = await fetchRedditAll(subreddit, "month", 10);
    clearInterval(loading);
    output.textContent = JSON.stringify(posts, null, 2);
  } catch (err) {
    output.textContent = `Error: ${err.message}`;
  }

});

