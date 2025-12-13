import Chart from 'chart.js/auto';

/**
 * Creates a simple line chart showing number of posts over time
 * @param {Array} posts - Array of Reddit posts from main.js
 * @param {string} canvasId - ID of the canvas element
 * @param {string} timeframe - Timeframe for grouping (day, week, month, all)
 */
export function createPostsOverTimeChart(posts, canvasId, timeframe = 'month') {
  // Group posts by date or hour depending on timeframe
  const postsByDate = {};
  const isHourly = timeframe === 'day';

  posts.forEach(post => {
    const date = new Date(post.createdUtc * 1000);
    let dateKey;

    if (isHourly) {
      // Group by hour for daily timeframe
      const hour = date.getHours();
      const dateStr = date.toISOString().split('T')[0];
      dateKey = `${dateStr} ${hour.toString().padStart(2, '0')}:00`;
    } else {
      // Group by date for other timeframes
      dateKey = date.toISOString().split('T')[0];
    }

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
        label: isHourly ? 'Posts per Hour' : 'Posts per Day',
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
          text: isHourly ? 'Reddit Posts by Hour' : 'Reddit Posts Over Time',
          color: 'rgba(255, 255, 255, 0.9)',
          font: {
            size: 20
          }
        },
        legend: {
          labels: {
            color: 'rgba(255, 255, 255, 0.9)'
          }
        }
      },
      backgroundColor: 'rgba(0, 0, 0, 0.3)',
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Number of Posts',
            color: 'rgba(255, 255, 255, 0.9)'
          },
          ticks: {
            color: 'rgba(255, 255, 255, 0.8)'
          },
          grid: {
            color: 'rgba(255, 255, 255, 0.2)'
          }
        },
        x: {
          title: {
            display: true,
            text: isHourly ? 'Hour' : 'Date',
            color: 'rgba(255, 255, 255, 0.9)'
          },
          ticks: {
            color: 'rgba(255, 255, 255, 0.8)'
          },
          grid: {
            color: 'rgba(255, 255, 255, 0.2)'
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
          text: 'Average Post Score Over Time',
          color: 'rgba(255, 255, 255, 0.9)',
          font: {
            size: 20
          }
        },
        legend: {
          labels: {
            color: 'rgba(255, 255, 255, 0.9)'
          }
        }
      },
      backgroundColor: 'rgba(0, 0, 0, 0.3)',
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Average Score',
            color: 'rgba(255, 255, 255, 0.9)'
          },
          ticks: {
            color: 'rgba(255, 255, 255, 0.8)'
          },
          grid: {
            color: 'rgba(255, 255, 255, 0.2)'
          }
        },
        x: {
          ticks: {
            color: 'rgba(255, 255, 255, 0.8)'
          },
          grid: {
            color: 'rgba(255, 255, 255, 0.2)'
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
          text: 'Posts per Subreddit',
          color: 'rgba(255, 255, 255, 0.9)',
          font: {
            size: 20
          }
        },
        legend: {
          labels: {
            color: 'rgba(255, 255, 255, 0.9)'
          }
        }
      },
      backgroundColor: 'rgba(0, 0, 0, 0.3)',
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Number of Posts',
            color: 'rgba(255, 255, 255, 0.9)'
          },
          ticks: {
            color: 'rgba(255, 255, 255, 0.8)'
          },
          grid: {
            color: 'rgba(255, 255, 255, 0.2)'
          }
        },
        x: {
          title: {
            display: true,
            text: 'Subreddit',
            color: 'rgba(255, 255, 255, 0.9)'
          },
          ticks: {
            color: 'rgba(255, 255, 255, 0.8)'
          },
          grid: {
            color: 'rgba(255, 255, 255, 0.2)'
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
 * @param {string} timeframe - Timeframe for grouping (day, week, month, all)
 */
export function createKeywordTrendChart(posts, keyword, canvasId, timeframe = 'month') {
  // Group posts by date or hour and count keyword mentions
  const keywordByDate = {};
  const totalByDate = {};
  const lowerKeyword = keyword.toLowerCase();
  const isHourly = timeframe === 'day';

  posts.forEach(post => {
    const date = new Date(post.createdUtc * 1000);
    let dateKey;

    if (isHourly) {
      // Group by hour for daily timeframe
      const hour = date.getHours();
      const dateStr = date.toISOString().split('T')[0];
      dateKey = `${dateStr} ${hour.toString().padStart(2, '0')}:00`;
    } else {
      // Group by date for other timeframes
      dateKey = date.toISOString().split('T')[0];
    }

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
          text: `Keyword Trend: "${keyword}" ${isHourly ? 'by Hour' : 'Over Time'}`,
          color: 'rgba(255, 255, 255, 0.9)',
          font: {
            size: 20
          }
        },
        legend: {
          labels: {
            color: 'rgba(255, 255, 255, 0.9)'
          }
        }
      },
      backgroundColor: 'rgba(0, 0, 0, 0.3)',
      scales: {
        y: {
          type: 'linear',
          display: true,
          position: 'left',
          beginAtZero: true,
          title: {
            display: true,
            text: 'Number of Posts',
            color: 'rgba(255, 255, 255, 0.9)'
          },
          ticks: {
            color: 'rgba(255, 255, 255, 0.8)'
          },
          grid: {
            color: 'rgba(255, 255, 255, 0.2)'
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
            text: 'Percentage (%)',
            color: 'rgba(255, 255, 255, 0.9)'
          },
          ticks: {
            color: 'rgba(255, 255, 255, 0.8)'
          },
          grid: {
            drawOnChartArea: false,
            color: 'rgba(255, 255, 255, 0.2)'
          }
        },
        x: {
          title: {
            display: true,
            text: isHourly ? 'Hour' : 'Date',
            color: 'rgba(255, 255, 255, 0.9)'
          },
          ticks: {
            color: 'rgba(255, 255, 255, 0.8)'
          },
          grid: {
            color: 'rgba(255, 255, 255, 0.2)'
          }
        }
      }
    }
  });
}
