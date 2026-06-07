import { auth } from '@clerk/nextjs/server'
import { chatCompletion } from '@/lib/groq'
import { NextResponse } from 'next/server'

async function runAgent(name, systemPrompt, userPrompt, model = 'llama-3.3-70b-versatile') {
  return await chatCompletion({
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    temperature: 0.6,
    max_tokens: 600
  })
}

export async function POST(req) {
  const { userId } = auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { task } = await req.json()
  if (!task) return NextResponse.json({ error: 'task required' }, { status: 400 })

  try {
    // Agent 1: Planner
    const plan = await runAgent('Planner',
      'You are a Planner AI. Break down the given task into exactly 3 clear, actionable sub-goals. Format: 1. [goal] 2. [goal] 3. [goal]. Be concise.',
      `Task: "${task}"`
    )

    // Agent 2: Researcher — sees planner output
    const research = await runAgent('Researcher',
      'You are a Researcher AI. Given sub-goals and a task, provide key facts, data points, and domain-specific considerations. Be specific and factual.',
      `Task: "${task}"\n\nSub-goals from Planner:\n${plan}\n\nProvide research findings:`
    )

    // Agent 3: Writer — sees planner + researcher output
    const draft = await runAgent('Writer',
      'You are a Writer AI. Using the plan and research, write a polished, structured, actionable response. Use clear headings if helpful.',
      `Task: "${task}"\n\nPlan:\n${plan}\n\nResearch:\n${research}\n\nWrite the final response:`
    )

    // Agent 4: Critic — reviews and improves
    const final = await runAgent('Critic',
      'You are a Critic AI. Review the draft for quality, accuracy, and completeness. Output ONLY the improved final version — no meta-commentary.',
      `Original task: "${task}"\n\nDraft to review:\n${draft}\n\nImproved final version:`
    )

    return NextResponse.json({ plan, research, draft, final, success: true })
  } catch (err) {
    console.error('Agent pipeline error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
