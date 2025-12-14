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

const STOP_WORDS = new Set([
  "the", "a", "an", "and", "or", "but", "if", "then", "else",
  "on", "in", "at", "to", "from", "by", "with", "about",
  "for", "of", "is", "are", "was", "were", "be", "been",
  "this", "that", "these", "those",
  "i", "you", "he", "she", "they", "we",
  "it", "its", "as", "not", "no", "yes",
  "my", "your", "our", "their", "was", "for",
  "are"
]);

function extractKeywords(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .split(/\s+/)                   
    .filter(word =>word.length > 2 && !STOP_WORDS.has(word));
}

let posts = []

let subredditSubscribers = {

}
let keywords = {

}
function curateSubredditsKeywords(){

    for (let post of posts){
        subredditSubscribers[post.subreddit] = post.subreddit_subscribers
        let kw = extractKeywords(post.title)

        for (let word of kw){
            if (word in keywords){
                keywords[word]+=1
            }else{
                keywords[word]=1
            }
        }

    }

}

let loaded = false

window.onload = async function(){
    posts = cache.get("month")
    if (!posts){
        posts = await fetchRedditAll("all", "month", 10)
        cache.set("month", posts)
    }
    curateSubredditsKeywords()
    loaded = true
    document.getElementById("start").disabled = false
}

let paths = {
    "Blue":{
        "run":"sprites/bluerun.gif",
        "die":"sprites/bluedie.gif"
    },
    "White":{
        "run":"sprites/whiterun.gif",
        "die":"sprites/whitedie.gif"
    }
}

document.getElementById("start").onclick = function(){

    document.getElementById("start").style.display = 'none';

    let dino1 = "Blue"
    let dino2 = "White"

    if (Math.random() < 0.5){
        dino2 = "Blue"
        dino1 = "White"
    }

    let img1 = document.getElementById("dino1")
    let img2 = document.getElementById("dino2")

    document.getElementById("answer1").style.display = "block";
    document.getElementById("answer2").style.display = "block";

    img1.src = paths[dino1].run
    img2.src = paths[dino2].run

    let question = findQuestion()

    if (question.type=="sub"){
        document.getElementById("question").innerHTML = "In the past month, which subreddit is more popular?"
    }else{
        document.getElementById("question").innerHTML = "In the past month, which keyword is used more frequently?"
    }

    document.getElementById("answerselection1").innerHTML = question.data.answer1
    document.getElementById("answerselection2").innerHTML = question.data.answer2
    let correct = question.data.correct
    let correctdino = correct == question.data.answer1 ? 1 : 2
    let over = ()=>{
        let loser = correctdino == 1 ? 2 : 1
        if (loser==1){
            document.getElementById("dino1").src = paths[dino1].die
        }else{
            document.getElementById("dino2").src = paths[dino2].die
        }
    }

    document.getElementById("answerselection1").onclick = ()=>{
        if (correctdino == 1){
            win()
        }else{
            lose()
        }
    }
    document.getElementById("answerselection2").onclick = ()=>{
        if (correctdino == 2){
            win()
        }else{
            lose()
        }
    }

    let win = () =>{
        over()
        document.getElementById("question").innerHTML = "CORRECT!"
        document.getElementById("start").style.display = 'inline-block';
        document.getElementById("start").innerHTML = "Try Again?"
    }

    let lose = () =>{
        over()
        document.getElementById("question").innerHTML = "INCORRECT!"
        document.getElementById("start").style.display = 'inline-block';
        document.getElementById("start").innerHTML = "Try Again?"
    }
}

function findQuestion(){
    let type = "sub"
    if (Math.random()<0.5){
        type="kw"
    }

    return {
        type:type,
        data: type=="sub" ? subredditQuestion() : keywordQuestion()
    }
}

function subredditQuestion(){

    let post1 = posts[Math.floor(Math.random() * posts.length)];
    let post2;
    do{
        post2 = posts[Math.floor(Math.random() * posts.length)];
    }while (post1.subreddit == post2.subreddit);

    return {
        answer1: post1.subreddit,
        answer2: post2.subreddit,
        correct: subredditSubscribers[post1.subreddit] > subredditSubscribers[post2.subreddit] ? post1.subreddit : post2.subreddit
    }

}

function keywordQuestion(){
    let kws = Object.keys(keywords);

    let kw1 = kws[Math.floor(Math.random() * kws.length)]
    let kw2;
    do{
        kw2 = kws[Math.floor(Math.random() * kws.length)]
    }while(kw1 == kw2);

    return {
        answer1: kw1,
        answer2: kw2,
        correct: keywords[kw1] > keywords[kw2] ? kw1 : kw2
    }
}