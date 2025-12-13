import Chart from 'chart.js/auto';

/**
 * Creates a simple line chart showing number of posts over time
 * @param {Array} posts - Array of Reddit posts from main.js
 * @param {string} canvasId - ID of the canvas element
 */
export function createPostsOverTimeChart(posts, canvasId) {
  // Group posts by date
  const postsByDate = {};

  posts.forEach(post => {
    // Convert Unix timestamp to date string (YYYY-MM-DD)
    const date = new Date(post.createdUtc * 1000);
    const dateKey = date.toISOString().split('T')[0];

    if (!postsByDate[dateKey]) {
      postsByDate[dateKey] = 0;
    }
    postsByDate[dateKey]++;
  });

  // Sort dates and prepare chart data
  const sortedDates = Object.keys(postsByDate).sort();
  const counts = sortedDates.map(date => postsByDate[date]);

  const ctx = document.getElementById(canvasId).getContext('2d');

  return new Chart(ctx, {
    type: 'line',
    data: {
      labels: sortedDates,
      datasets: [{
        label: 'Posts per Day',
        data: counts,
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.1
      }]
    },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: 'Reddit Posts Over Time'
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Number of Posts'
          }
        },
        x: {
          title: {
            display: true,
            text: 'Date'
          }
        }
      }
    }
  });
}

/**
 * Creates a bar chart showing average score over time
 * @param {Array} posts - Array of Reddit posts
 * @param {string} canvasId - ID of the canvas element
 */
export function createAverageScoreChart(posts, canvasId) {
  // Group posts by date and calculate average score
  const scoresByDate = {};

  posts.forEach(post => {
    const date = new Date(post.createdUtc * 1000);
    const dateKey = date.toISOString().split('T')[0];

    if (!scoresByDate[dateKey]) {
      scoresByDate[dateKey] = { total: 0, count: 0 };
    }
    scoresByDate[dateKey].total += post.score;
    scoresByDate[dateKey].count++;
  });

  // Calculate averages
  const sortedDates = Object.keys(scoresByDate).sort();
  const averages = sortedDates.map(date =>
    Math.round(scoresByDate[date].total / scoresByDate[date].count)
  );

  const ctx = document.getElementById(canvasId).getContext('2d');

  return new Chart(ctx, {
    type: 'bar',
    data: {
      labels: sortedDates,
      datasets: [{
        label: 'Average Score',
        data: averages,
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
        borderColor: 'rgb(255, 99, 132)',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: 'Average Post Score Over Time'
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Average Score'
          }
        }
      }
    }
  });
}

/**
 * Creates a bar chart showing number of posts per subreddit
 * @param {Array} posts - Array of Reddit posts
 * @param {string} canvasId - ID of the canvas element
 */
export function createPostsPerSubredditChart(posts, canvasId) {
  // Count posts by subreddit
  const postsBySubreddit = {};

  posts.forEach(post => {
    const subreddit = post.subreddit || 'Unknown';

    if (!postsBySubreddit[subreddit]) {
      postsBySubreddit[subreddit] = 0;
    }
    postsBySubreddit[subreddit]++;
  });

  // Sort subreddits by count (descending) and prepare chart data
  const sortedSubreddits = Object.entries(postsBySubreddit)
    .sort((a, b) => b[1] - a[1])
    .map(entry => entry[0]);

  const counts = sortedSubreddits.map(subreddit => postsBySubreddit[subreddit]);

  const ctx = document.getElementById(canvasId).getContext('2d');

  return new Chart(ctx, {
    type: 'bar',
    data: {
      labels: sortedSubreddits,
      datasets: [{
        label: 'Number of Posts',
        data: counts,
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
        borderColor: 'rgb(54, 162, 235)',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: 'Posts per Subreddit'
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Number of Posts'
          }
        },
        x: {
          title: {
            display: true,
            text: 'Subreddit'
          }
        }
      }
    }
  });
}

/**
 * Creates a line chart tracking keyword mentions over time
 * @param {Array} posts - Array of Reddit posts
 * @param {string} keyword - Keyword to track (case-insensitive)
 * @param {string} canvasId - ID of the canvas element
 */
export function createKeywordTrendChart(posts, keyword, canvasId) {
  // Group posts by date and count keyword mentions
  const keywordByDate = {};
  const totalByDate = {};
  const lowerKeyword = keyword.toLowerCase();

  posts.forEach(post => {
    const date = new Date(post.createdUtc * 1000);
    const dateKey = date.toISOString().split('T')[0];

    // Initialize counters if needed
    if (!keywordByDate[dateKey]) {
      keywordByDate[dateKey] = 0;
      totalByDate[dateKey] = 0;
    }

    // Check if post title contains the keyword
    const titleLower = (post.title || '').toLowerCase();
    if (titleLower.includes(lowerKeyword)) {
      keywordByDate[dateKey]++;
    }

    totalByDate[dateKey]++;
  });

  // Sort dates and prepare chart data
  const sortedDates = Object.keys(keywordByDate).sort();
  const counts = sortedDates.map(date => keywordByDate[date]);

  // Calculate percentage for secondary axis
  const percentages = sortedDates.map(date =>
    totalByDate[date] > 0 ? ((keywordByDate[date] / totalByDate[date]) * 100).toFixed(2) : 0
  );

  const ctx = document.getElementById(canvasId).getContext('2d');

  return new Chart(ctx, {
    type: 'line',
    data: {
      labels: sortedDates,
      datasets: [
        {
          label: `Posts mentioning "${keyword}"`,
          data: counts,
          borderColor: 'rgb(255, 99, 132)',
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
          tension: 0.1,
          yAxisID: 'y'
        },
        {
          label: 'Percentage of all posts',
          data: percentages,
          borderColor: 'rgb(153, 102, 255)',
          backgroundColor: 'rgba(153, 102, 255, 0.2)',
          tension: 0.1,
          yAxisID: 'y1'
        }
      ]
    },
    options: {
      responsive: true,
      interaction: {
        mode: 'index',
        intersect: false
      },
      plugins: {
        title: {
          display: true,
          text: `Keyword Trend: "${keyword}" Over Time`
        }
      },
      scales: {
        y: {
          type: 'linear',
          display: true,
          position: 'left',
          beginAtZero: true,
          title: {
            display: true,
            text: 'Number of Posts'
          }
        },
        y1: {
          type: 'linear',
          display: true,
          position: 'right',
          beginAtZero: true,
          max: 100,
          title: {
            display: true,
            text: 'Percentage (%)'
          },
          grid: {
            drawOnChartArea: false
          }
        },
        x: {
          title: {
            display: true,
            text: 'Date'
          }
        }
      }
    }
  });
}
