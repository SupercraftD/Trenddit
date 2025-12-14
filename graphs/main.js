
import { createPostsOverTimeChart, createPostsPerSubredditChart, createKeywordTrendChart } from "./chart.js";

const REDDIT_BASE = "https://www.reddit.com";
const CORS_PROXY = "https://mycorsproxy.dzhu700.workers.dev/?url=";
const LIMIT = 100;

// Store chart instances to destroy them later
let chartInstances = {
  myChart: null,
  subredditChart: null,
  keywordChart: null
};

// Cache for storing fetched posts by timeframe
const CACHE_KEY = 'reddit_posts_cache';
const cache = {
  get(timeframe) {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (!cached) return null;
      const data = JSON.parse(cached);
      return data[timeframe] || null;
    } catch (e) {
      return null;
    }
  },
  set(timeframe, posts) {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      const data = cached ? JSON.parse(cached) : {};
      data[timeframe] = posts;
      localStorage.setItem(CACHE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error('Failed to cache data:', e);
    }
  }
};

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
  let a = json.data.children.map(({ data }) => ({
    id: data.id,
    title: data.title,
    score: data.score,
    comments: data.num_comments,
    subreddit: data.subreddit,
    subreddit_subscribers: data.subreddit_subscribers,
    author: data.author,
    createdUtc: data.created_utc,
    url: data.permalink ? `https://reddit.com${data.permalink}` : null,
    nsfw: data.over_18
  }));

  a = a.filter(item => !item.nsfw);
  return a;
}

// Fetch all pages for a time window (paginated)
async function fetchRedditAll(subreddit = "all", time = "day", maxPages = 5) {
  let allPosts = [];
  let after = null;
  maxPages = 1
  for (let page = 0; page < maxPages; page++) {
    const json = await fetchRedditPage(subreddit, time, after);
    const posts = json;
    console.log(posts)
    if (posts.length === 0) break;

    allPosts.push(...posts);
  }

  return allPosts;
}


// Wrap canvases in blur containers on page load
document.addEventListener("DOMContentLoaded", () => {
  const canvases = document.querySelectorAll("canvas");
  canvases.forEach(canvas => {
    const wrapper = document.createElement("div");
    wrapper.className = "chart-wrapper";
    canvas.parentNode.insertBefore(wrapper, canvas);
    wrapper.appendChild(canvas);
  });
});

document.getElementById("fetch").addEventListener("click", async () => {
  const output = document.getElementById("output");
  const timeframe = document.getElementById("timeframe").value;
  const keyword = document.getElementById("keyword").value;

  // Destroy existing charts before creating new ones
  if (chartInstances.myChart) {
    chartInstances.myChart.destroy();
  }
  if (chartInstances.subredditChart) {
    chartInstances.subredditChart.destroy();
  }
  if (chartInstances.keywordChart) {
    chartInstances.keywordChart.destroy();
  }

  // Check cache first
  const cachedPosts = cache.get(timeframe);
  if (cachedPosts) {
    output.textContent = `Using cached data for ${timeframe}`;
    chartInstances.myChart = createPostsOverTimeChart(cachedPosts, "myChart", timeframe);
    chartInstances.subredditChart = createPostsPerSubredditChart(cachedPosts, "subredditChart");
    chartInstances.keywordChart = createKeywordTrendChart(cachedPosts, keyword, "keywordChart", timeframe);
    output.textContent = `Loaded ${cachedPosts.length} posts from cache`;
    return;
  }

  // Fetch new data if not cached
  output.textContent = "Fetching";
  let loading = setInterval(() => {
    output.textContent += ".";
    if (output.textContent.length > 20) output.textContent = "Fetching";
  }, 500);
  try {
    const subreddit = "all";
    const posts = await fetchRedditAll(subreddit, timeframe, 10);
    clearInterval(loading);

    // Cache the fetched data
    cache.set(timeframe, posts);

    chartInstances.myChart = createPostsOverTimeChart(posts, "myChart", timeframe);
    chartInstances.subredditChart = createPostsPerSubredditChart(posts, "subredditChart");
    chartInstances.keywordChart = createKeywordTrendChart(posts, keyword, "keywordChart", timeframe);
    output.textContent = `Loaded ${posts.length} posts successfully`;
  } catch (err) {
    clearInterval(loading);
    output.textContent = `Error: ${err.message}`;
  }

});

