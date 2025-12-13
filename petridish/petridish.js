
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
    subreddit_subscribers: data.subreddit_subscribers,
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

let distributions = {
    "day":{},
    "week":{},
    "month":{},
    "all":{}
}

let subredditInfo = {
    "day":{},
    "week":{},
    "month":{},
    "all":{}
}

async function getDistributions(time){

    if (Object.keys(distributions[time]).length > 0) {
        console.log(distributions[time])
        return distributions[time];
    }else{
        console.log("FETCHING DISTRIBUTION")
        let posts = cache.get(time);
        if (!posts){
            posts = await fetchRedditAll("all", time, 10)
            cache.set(time, posts)
        }
        
        for (let post of posts){
            if (distributions[time][post.subreddit]){
                distributions[time][post.subreddit] += 1;
            }else{
                distributions[time][post.subreddit] = 1;
            }
        }
        return distributions[time];
    }
}

async function getSubredditInfo(time){
    if (Object.keys(subredditInfo[time]).length > 0) {
        return subredditInfo[time];
    }else{
        let posts = cache.get(time);
        if (!posts){
            posts = await fetchRedditAll("all", time, 10)
            cache.set(time, posts)
        }
        console.log(posts)
        for (let post of posts){
            if (!subredditInfo[time][post.subreddit]){
                subredditInfo[time][post.subreddit] = {
                    subscribers: post.subreddit_subscribers,
                    topPosts: [post]
                }
            }else{
                subredditInfo[time][post.subreddit].topPosts.push(post);
                subredditInfo[time][post.subreddit].topPosts.sort((a,b) => b.score - a.score);
                if (subredditInfo[time][post.subreddit].topPosts.length > 5){
                    subredditInfo[time][post.subreddit].topPosts.pop();
                }
            }
        }
        console.log(subredditInfo[time])
        return subredditInfo[time];
    }
}

const maxCircleRadius = 75;
let existingCircles = [];
let activeSubs = {}
const canvas = document.getElementById('petridish-canvas');

let selectedCircle = null;
let currentTime = "day";

async function drawPetriDish(time){
    currentTime = time;
    const ctx = canvas.getContext('2d');

    const width = canvas.width;
    const height = canvas.height;

    /*// Fill the canvas with a light grid background
    ctx.fillStyle = '#ffffffff';
    ctx.strokeStyle = '#d4d4d4ff';

    const gridSize = 20;
    for (let x = 0; x <= width; x += gridSize) {
        for (let y = 0; y <= height; y += gridSize) {
            ctx.fillRect(x, y, gridSize - 1, gridSize - 1);
            ctx.strokeRect(x, y, gridSize, gridSize);
        }
    }*/
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw a simple circle in the center
    ctx.fillStyle = "#ffffff";
    ctx.strokeStyle = "#000000";
    ctx.beginPath();
    ctx.arc(width / 2, height / 2, Math.min(height,width)/2-20, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fill();


    document.getElementById("loading").innerHTML = "Loading..."
    
    const distribution = await getDistributions(time);
    const subreddits = Object.keys(distribution);
    activeSubs = await getSubredditInfo(time);
    console.log(activeSubs);
    
    document.getElementById("loading").innerHTML = ""

    existingCircles = [];

    let giveup = false
    for (let subreddit of subreddits){
        const count = distribution[subreddit];

        let x, y;
        let tries = 0
        do{
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * (Math.min(height,width)/2 - 40);
            tries+=1
            x = width / 2 + radius * Math.cos(angle);
            y = height / 2 + radius * Math.sin(angle);
        }while((existingCircles.some(c => {
            const dx = c.x - x;
            const dy = c.y - y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            return distance < c.size + Math.min(maxCircleRadius, 5 + count); // Ensure no overlap
        })) && tries < 100 && !giveup );

        if (tries >= 100) {
            giveup = true;
        }
        let color = `hsl(${Math.random() * 360}, 70%, 60%)`

        existingCircles.push({x, y, size: Math.min(maxCircleRadius, 5 + count), subreddit: subreddit, count: count, color:color});

        const size = Math.min(maxCircleRadius, 5 + count); // Size based on count, capped at maxCircleRadius

        // Draw the "colony"
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();

        // Draw border if selected
        if (selectedCircle && selectedCircle.subreddit === subreddit) {
            ctx.strokeStyle = "#000000";
            ctx.lineWidth = 3;
            ctx.stroke();
        }
    }
}

function drawCircles(){
    const ctx = canvas.getContext('2d');

    const width = canvas.width;
    const height = canvas.height;

    /*// Fill the canvas with a light grid background
    ctx.fillStyle = '#ffffffff';
    ctx.strokeStyle = '#d4d4d4ff';

    const gridSize = 20;
    for (let x = 0; x <= width; x += gridSize) {
        for (let y = 0; y <= height; y += gridSize) {
            ctx.fillRect(x, y, gridSize - 1, gridSize - 1);
            ctx.strokeRect(x, y, gridSize, gridSize);
        }
    }*/
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw a simple circle in the center
    ctx.fillStyle = "#ffffff";
    ctx.strokeStyle = "#000000";
    ctx.beginPath();
    ctx.arc(width / 2, height / 2, Math.min(height,width)/2-20, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fill();

    for (let circle of existingCircles){
        let count = circle.count
        let subreddit = circle.subreddit
        let x = circle.x
        let y = circle.y
        
        const size = Math.min(maxCircleRadius, 5 + count); // Size based on count, capped at maxCircleRadius

        // Draw the "colony"
        ctx.fillStyle = circle.color;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();

        // Draw border if selected
        if (selectedCircle && selectedCircle.subreddit === subreddit) {
            ctx.strokeStyle = "#000000";
            ctx.lineWidth = 3;
            ctx.stroke();
        }

    }
}

//display info when circle is hovered over
canvas.addEventListener('mousemove', function(event) {

    if (selectedCircle != null){
        return
    }

    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    const canvasX = mouseX * canvas.width / rect.width;
    const canvasY = mouseY * canvas.height / rect.height;

    let hoveredCircle = null;
    for (let circle of existingCircles) {
        const dx = circle.x - canvasX;
        const dy = circle.y - canvasY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < circle.size) {
            hoveredCircle = circle;
        }
    }

    if (hoveredCircle) {
        document.getElementById("subredditname").textContent = `r/${hoveredCircle.subreddit}`;
        document.getElementById("subredditinfo").textContent = `${activeSubs[hoveredCircle.subreddit] ? activeSubs[hoveredCircle.subreddit].subscribers : "N/A"} Subscribers, Recent Posts: ${hoveredCircle.count}`;
        document.getElementById("toppostlist").innerHTML = ``;

        for (let post of activeSubs[hoveredCircle.subreddit].topPosts){
            const li = document.createElement("li");
            const a = document.createElement("a");
            a.href = post.url;
            a.textContent = `${post.title} (Score: ${post.score})`;
            a.target = "_blank";
            li.appendChild(a);
            document.getElementById("toppostlist").appendChild(li);
        }

    }
    

});

canvas.addEventListener("mousedown", function(event){
    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    const canvasX = mouseX * canvas.width / rect.width;
    const canvasY = mouseY * canvas.height / rect.height;

    let hoveredCircle = null;
    for (let circle of existingCircles) {
        const dx = circle.x - canvasX;
        const dy = circle.y - canvasY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < circle.size) {
            hoveredCircle = circle;
        }
    }

    if (hoveredCircle) {

        if (hoveredCircle == selectedCircle){
            selectedCircle = null
        }else{
            selectedCircle = hoveredCircle
        }

        drawCircles();

        document.getElementById("subredditname").textContent = `r/${hoveredCircle.subreddit}`;
        document.getElementById("subredditinfo").textContent = `${activeSubs[hoveredCircle.subreddit] ? activeSubs[hoveredCircle.subreddit].subscribers : "N/A"} Subscribers, Recent Posts: ${hoveredCircle.count}`;
        document.getElementById("toppostlist").innerHTML = ``;

        for (let post of activeSubs[hoveredCircle.subreddit].topPosts){
            const li = document.createElement("li");
            const a = document.createElement("a");
            a.href = post.url;
            a.textContent = `${post.title} (Score: ${post.score})`;
            a.target = "_blank";
            li.appendChild(a);
            document.getElementById("toppostlist").appendChild(li);
        }

    

    }
})

window.onload = function() {
    drawPetriDish("day");
}

document.getElementById("times").onchange = function(){
    selectedCircle = null;
    drawPetriDish(document.getElementById("times").value)
}
