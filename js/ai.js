/**
 * AI Utility Functions for ScholarSeva
 * Communicates with the proxy backend at http://localhost:5000/api/ai
 */

const AI_SERVER_URL = 'http://localhost:5000/api/ai';

async function callAI(prompt, model = 'openai/gpt-3.5-turbo') {
  console.log(`[AI Request] Model: ${model} | Prompt len: ${prompt.length}`);

  try {
    const response = await fetch(AI_SERVER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ prompt, model })
    });

    if (!response.ok) {
        console.error(`[AI Error] HTTP Status: ${response.status}`);
        return "AI temporarily unavailable";
    }

    const data = await response.json();
    console.log('[AI Response]:', data);

    if (data.is_fallback) {
       console.warn('[AI Service] Response generated using fallback result.');
    }

    return data.result || "AI temporarily unavailable";
  } catch (error) {
    console.error('[AI Exception]:', error);
    return 'AI temporarily unavailable';
  }
}

/**
 * FEATURE 1: AI Match Explanation
 */
async function generateMatchExplanation(user, scholarship) {
  const cacheKey = `ai_${scholarship.id}_explanation`;
  const cached = localStorage.getItem(cacheKey);
  if (cached) return cached;

  const prompt = `Explain why this scholarship is suitable for the user in 3-4 short bullet points.

User:
* Category: ${user.category || 'N/A'}
* Income: ${user.income || 'N/A'}
* State: ${user.state || 'N/A'}
* Education: ${user.education || 'N/A'}

Scholarship:
* Name: ${scholarship.name}
* Category: ${scholarship.category}
* Income Limit: ₹${scholarship.income_limit ? scholarship.income_limit.value : 'N/A'}
* Education: ${scholarship.education_level}`;

  const result = await callAI(prompt, 'openai/gpt-3.5-turbo');
  if (result && !result.includes('unavailable')) {
    localStorage.setItem(cacheKey, result);
  }
  return result;
}

/**
 * FEATURE 2: AI Compare Summary
 */
async function generateCompareSummary(selectedScholarships) {
  const ids = selectedScholarships.map(s => s.id).sort().join('_');
  const cacheKey = `ai_compare_${ids}`;
  const cached = localStorage.getItem(cacheKey);
  if (cached) return cached;

  const summaryData = selectedScholarships.map(s => ({
    name: s.name,
    matchScore: s.matchScore,
    success: s.success
  }));

  const prompt = `Compare these scholarships and give a short conclusion (2-3 lines):
Best overall vs Easiest to get.
Data: ${JSON.stringify(summaryData)}`;

  const result = await callAI(prompt, 'openai/gpt-3.5-turbo');
  if (result && !result.includes('unavailable')) {
    localStorage.setItem(cacheKey, result);
  }
  return result;
}

/**
 * FEATURE 3: AI Quick Summary
 */
async function generateQuickSummary(scholarship) {
  const cacheKey = `ai_${scholarship.id}_summary`;
  const cached = localStorage.getItem(cacheKey);
  if (cached) return cached;

  const prompt = `Summarize into 3-4 short bullet points (Benefits, Key Info):
Text: ${scholarship.description}`;

  const result = await callAI(prompt, 'mistralai/mistral-7b-instruct:free');
  if (result && !result.includes('unavailable')) {
    localStorage.setItem(cacheKey, result);
  }
  return result;
}

/**
 * FEATURE 4: AI Best Choice Suggestion
 */
async function generateBestChoice(scholarships, user) {
  const ids = scholarships.map(s => s.id).sort().join('_');
  const cacheKey = `ai_best_${ids}`;
  const cached = localStorage.getItem(cacheKey);
  if (cached) return cached;

  const prompt = `Suggest the best scholarship for the user and explain why in 2 lines.
User: ${JSON.stringify(user)}
Scholarships: ${JSON.stringify(scholarships.map(s => ({name: s.name, match: calculateMatchScore(user, s)})))}`;

  const result = await callAI(prompt, 'anthropic/claude-3-haiku');
  if (result && !result.includes('unavailable')) {
    localStorage.setItem(cacheKey, result);
  }
  return result;
}

/**
 * FEATURE 5: AI Priority Alert
 */
async function generatePriorityMessage(scholarship, score, daysLeft) {
  const cacheKey = `ai_${scholarship.id}_priority_${daysLeft}`;
  const cached = localStorage.getItem(cacheKey);
  if (cached) return cached;

  const prompt = `Generate a short priority message for this scholarship (Mention deadline/match strength):
Scholarship: ${scholarship.name}
Match: ${score}%
Deadline: ${daysLeft || 'Ongoing'} days left`;

  const result = await callAI(prompt, 'mistralai/mistral-7b-instruct:free');
  if (result && !result.includes('unavailable')) {
    localStorage.setItem(cacheKey, result);
  }
  return result;
}
