import { convertToModelMessages, streamText, tool } from 'ai';
import { z } from 'zod';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';

// Create OpenRouter provider
const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY!,
});

export const maxDuration = 30;

export async function POST(req: Request) {
  const conversationId = "conv_import_001";
  const { messages } = await req.json();
    const last = messages[messages.length - 1];


  await fetch("https://nextjschatbot-rho.vercel.app/api/db", {
  method: "POST",
  body: JSON.stringify({
    ...last,
    conversation_id: conversationId,
  }),
});

  // Helper: Dummy ticket creator
  function createDummyTicket(data: any) {
    console.log('createDummyTicket', data)
    const randomId = 'TCK-' + Math.floor(10000 + Math.random() * 90000);
    return {
      ticketId: randomId,
      ...data,
      createdAt: new Date().toISOString(),
      status: 'open',
    };
  }

  // Stream response from AI model
  const result = streamText({
    model: openrouter.languageModel('minimax/minimax-m2:free'),
    messages: convertToModelMessages(messages),

    system: `
You are a helpful **Company Assistant Chatbot**.

Your purpose is to help employees with **HR and company-related issues**, including:
- Leave requests
- Salary concerns
- Complaints or HR support
- Other internal process-related help

---

### 💡 Behavior Rules

1. **Identify intent first:**
   - If the user is just greeting ("hi", "hello", etc.) → Respond politely, no tools.
   - If the user is asking general info ("what can you do?", "how do I apply for leave?") → Answer directly, no tools.
   - If the user clearly describes an actionable issue that needs internal handling (e.g., "I want to request leave", "My salary seems incorrect", "I have a complaint") → proceed to step 2.

2. **If the issue requires structured data collection** → call the tool \`dynamicformfields\`.
   Generate a form that collects:
   - **Full Name**
   - **Email**
   - **Issue Type** (select)
   - **Detailed Description** (textarea)
   - **Priority** (select: low, medium, high)

   The form must be user-friendly and specific to the issue type.  
   For example:
   - For a leave request → call the form "Leave Request Form"
   - For a salary issue → call it "Salary Concern Form"
   - For a complaint → call it "Complaint Submission Form"

3. **After the user fills and submits the form:**
   → Call the tool \`createTicket\` using the submitted information to generate a new ticket.

4. **Once the ticket is created:**
   Respond clearly to the user with:
   - A success message (✅ Ticket created successfully!)
   - The **Ticket ID**
   - A short issue summary (Name, Issue Type, Priority)

---

### 🚫 What NOT to do
- Do **not** call any tool unless the user message clearly requires a ticket or structured data.
- Do **not** create forms for small talk or general questions.
- Always return tool calls in structured JSON (not plain text).

---

### 🧩 Example
**User:** "I need to apply for leave next week"
→ Call \`dynamicformfields\` and generate:
{
  "title": "Leave Request Form",
  "description": "Please fill in the details below to submit your leave request.",
  "fields": [...],
  "submitButtonText": "Submit"
}

**User:** "Thanks!"
→ Simple polite text response, no tool call.
`
,

    tools: {
      // Tool 1: Dynamic Form
      dynamicformfields: tool({
        description:
          'Generate a dynamic form when more user information is needed for a ticket (leave, salary issue, etc.)',
        inputSchema: z.object({
          title: z.string().describe('Title of the form'),
          description: z.string().describe('Purpose of the form'),
          fields: z.array(
            z.object({
              name: z.string().describe('Unique field name (camelCase)'),
              label: z.string().describe('Display label for the field'),
              type: z.enum([
                'text',
                'email',
                'number',
                'password',
                'textarea',
                'select',
                'checkbox',
                'date',
              ]),
              placeholder: z.string().optional(),
              required: z.boolean(),
              options: z
                .array(
                  z.object({
                    value: z.string(),
                    label: z.string(),
                  }),
                )
                .optional(),
            }),
          ),
          submitButtonText: z.string().describe('Text for the submit button'),
        }),
      }),

      // Tool 2: Ticket Creator
      createTicket: tool({
        description:
          'Creates a new company support ticket using the form data provided by the user.',
        inputSchema: z.object({
          name: z.string().describe('Full name of the user'),
          email: z.string().email().describe('User email'),
          issueType: z.string().describe('Type of issue (leave, salary, complaint, etc.)'),
          details: z.string().describe('Detailed issue description'),
          priority: z
            .enum(['low', 'medium', 'high'])
            .default('medium')
            .describe('Issue priority'),
        }),
        execute: async (input) => {
          const ticket = createDummyTicket(input);
          return {
            message: `✅ Ticket created successfully!`,
            ticket,
          };
        },
      }),
    },
  });

  return result.toUIMessageStreamResponse();
}
