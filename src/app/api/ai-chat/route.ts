import { NextRequest, NextResponse } from 'next/server';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';

interface AIChatRequest {
  message: string;
  context?: {
    currentFile?: string;
    fileContent?: string;
    projectType?: 'web' | 'mobile' | 'backend';
  };
  model?: 'gpt-4' | 'claude' | 'gemini';
}

export async function POST(req: NextRequest) {
  try {
    const { message, context, model = 'gemini' }: AIChatRequest = await req.json();

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Build context-aware prompt
    let systemPrompt = `You are an expert coding assistant helping with the current code. Provide helpful, specific advice and code suggestions.`;

    if (context?.currentFile && context?.fileContent) {
      systemPrompt += `

Current file: ${context.currentFile}
File content:
\`\`\`${context.projectType || 'typescript'}
${context.fileContent.slice(0, 3000)} // Truncated if too long
\`\`\`

When providing code changes, use this format:
\`\`\`diff
- old code
+ new code
\`\`\`

Or for new code:
\`\`\`typescript
// code here
\`\`\``;
    }

    const modelMap = {
      'gpt-4': 'openai/gpt-4o',
      'claude': 'anthropic/claude-3.5-sonnet',
      'gemini': 'google/gemini-2.5-flash'
    };

    const response = await fetch(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          'HTTP-Referer': 'http://localhost:3000',
          'X-Title': 'OpenForge AI Collab',
        },
        body: JSON.stringify({
          model: modelMap[model],
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: message }
          ],
          temperature: 0.7,
          max_tokens: 4000,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`AI API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content;

    if (!aiResponse) {
      throw new Error('No response from AI');
    }

    // Extract code suggestions if present
    const codeSuggestions = extractCodeFromResponse(aiResponse);

    return NextResponse.json({
      success: true,
      response: aiResponse,
      codeSuggestions: codeSuggestions,
      model: model
    });

  } catch (error) {
    console.error('AI Chat error:', error);
    return NextResponse.json(
      { error: 'Failed to get AI response', details: String(error) },
      { status: 500 }
    );
  }
}

function extractCodeFromResponse(response: string): Array<{language: string, code: string, type: 'diff' | 'full'}> {
  const suggestions: Array<{language: string, code: string, type: 'diff' | 'full'}> = [];
  
  // Extract diff blocks
  const diffRegex = /```diff\n([\s\S]*?)\n```/g;
  let match;
  while ((match = diffRegex.exec(response)) !== null) {
    suggestions.push({
      language: 'diff',
      code: match[1],
      type: 'diff'
    });
  }
  
  // Extract code blocks
  const codeRegex = /```(typescript|javascript|jsx|tsx)\n([\s\S]*?)\n```/g;
  while ((match = codeRegex.exec(response)) !== null) {
    suggestions.push({
      language: match[1],
      code: match[2],
      type: 'full'
    });
  }
  
  return suggestions;
}