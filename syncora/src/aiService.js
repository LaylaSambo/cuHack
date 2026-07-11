export async function optimizeSchedule(currentEvents, energyLevel, pendingGoals, fifaMode) {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  
  if (!apiKey) {
    alert("API Key is missing! Check your .env.local file configuration.");
    return null;
  }

  const systemInstruction = `
    You are Syncora AI, an intelligent daily scheduling assistant. 
    Your job is to merge a user's fixed activities and flexible goals into a beautifully balanced 1-day time-blocked schedule.

    Rules:
    1. NEVER overlap or change the hours of existing "locked" events.
    2. Convert your response directly into a JSON array of objects. Do not include markdown \`\`\`json blocks.
    3. Return precisely this data shape inside the array:
       { "id": "unique-id", "title": "Activity Name", "start": "HH:MM", "end": "HH:MM", "type": "locked" | "ai-scheduled" | "transit" | "fifa" }
  `;

const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`;

  const requestBody = {
    contents: [{
      parts: [{
        text: `
          Existing Fixed Blocks: ${JSON.stringify(currentEvents)}
          User Energy Target: "${energyLevel}"
          Goals to arrange: ${JSON.stringify(pendingGoals)}
          FIFA Mode: ${fifaMode}
        `
      }]
    }],
    systemInstruction: { parts: [{ text: systemInstruction }] },
    generationConfig: { responseMimeType: "application/json", temperature: 0.2 }
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    // Read the exact error message from Google's payload
    const errText = await response.text();
    throw new Error(`Google API Rejected (${response.status}): ${errText}`);
  }

  const data = await response.json();
  let textResponse = data.candidates[0].content.parts[0].text.trim();

  if (textResponse.includes('[')) {
    textResponse = textResponse.substring(textResponse.indexOf('['), textResponse.lastIndexOf(']') + 1);
  }

  return JSON.parse(textResponse);
}