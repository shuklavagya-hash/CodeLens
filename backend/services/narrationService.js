// narrationService.js
// =====================================================================
// KAAM: Graph se mile FACTS (jaise "ye file X, Y, Z files ko import
// karti hai, aur A, B files iss par depend karti hain") ko lekar,
// LOCAL AI model se plain-English explanation banwana.
//
// ZAROORI BAAT: Ye poora codebase kabhi AI ko nahi dikhata — sirf
// selected file ka naam + uske neighbors + chhota code snippet. Isse:
//   1) AI hallucinate nahi karta (guess nahi kar raha, humne already
//      graph se 100% accurate facts nikaal ke diye hain)
//   2) Bade repo (lakhon lines) pe bhi kaam karta hai, kyunki hum kabhi
//      poora repo ek saath LLM ko nahi bhejte
//
// ON-DEVICE vs FALLBACK: Iss service mein 2 providers support hote hain,
// AI_PROVIDER env variable se switch hota hai:
//
//   AI_PROVIDER=ollama (DEFAULT, recommended) — genuinely on-device,
//   tumhare apne laptop pe chalta hai, koi API key nahi chahiye,
//   koi code internet pe nahi jaata. CodeLens ka poora "on-device"
//   pitch isi pe based hai — hackathon judging criteria ke liye YEHI
//   use karo.
//
//   AI_PROVIDER=nvidia (SIRF BACKUP) — agar Ollama kisi wajah se
//   hackathon ke din fail ho jaye, isse turant switch kar sakte ho
//   (tumhare paas already NVIDIA_API_KEY hai FocusFlow se). Lekin
//   dhyan rahe: isse use karne par project genuinely "on-device" nahi
//   rehta — code/data cloud ko jaata hai. Sirf emergency ke liye.
// =====================================================================

import OpenAI from 'openai';

function getClient() {
  const provider = process.env.AI_PROVIDER || 'ollama';

  if (provider === 'nvidia') {
    return {
      client: new OpenAI({
        baseURL: 'https://integrate.api.nvidia.com/v1',
        apiKey: process.env.NVIDIA_API_KEY,
      }),
      model: 'meta/llama-3.1-70b-instruct',
    };
  }

  // Default: Ollama — local, no key needed
  return {
    client: new OpenAI({
      baseURL: process.env.OLLAMA_BASE_URL || 'http://localhost:11434/v1',
      apiKey: 'ollama', // Ollama key verify nahi karta, kuch bhi chalega — bas field required hai SDK ke liye
    }),
    model: process.env.AI_MODEL || 'llama3.2',
  };
}

/**
 * @param {string} nodeId - jis file ka explanation chahiye
 * @param {string} snippet - us file ka chhota sa code (pehli ~40 lines)
 * @param {string[]} dependsOn - ye file kise import karti hai
 * @param {string[]} dependedBy - kaun ise import karta hai (blast radius)
 */
export async function explainNode({ nodeId, snippet, dependsOn, dependedBy }) {
  // Client yahan (function ke andar) banate hain, module ke top pe nahi —
  // taaki dotenv.config() hamesha pehle chal chuka ho jab ye actually
  // call hota hai. (Ye humein pehle FocusFlow mein ek bug se seekhne
  // ko mila tha — import-order ki wajah se env variable undefined aa
  // raha tha.)
  const { client, model } = getClient();

  const prompt = `You are explaining a piece of a codebase to a developer who is about to modify it.

File: "${nodeId}"

This file depends on (imports): ${dependsOn.length ? dependsOn.join(', ') : 'nothing else in this repo'}
These files depend on it (would be affected by changes): ${dependedBy.length ? dependedBy.join(', ') : 'nothing — it appears safe to change'}

Here is the start of the file's code:
---
${snippet}
---

In 3-4 plain-English sentences, explain what this file most likely does, and how risky it would be to change it based on how many other files depend on it. Be direct and specific, not generic.`;

  try {
    const completion = await client.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: 'You are a precise, concise senior engineer explaining unfamiliar code.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.4,
      max_tokens: 220,
    });

    return completion.choices[0].message.content;
  } catch (error) {
    // Agar Ollama chal hi nahi raha (bhool gaye start karna), user ko
    // clear instruction do, generic crash nahi
    console.error('Ollama call failed:', error.message);
    throw new Error(
      'Local AI model se connect nahi ho paya. Check karo ki Ollama chal raha hai ("ollama serve") aur model download hai ("ollama pull llama3.2").'
    );
  }
}
