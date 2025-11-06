'use client';

import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from '@/components/ai-elements/conversation';
import { Message, MessageContent } from '@/components/ai-elements/message';
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputSubmit,
} from '@/components/ai-elements/prompt-input';
import { MessageSquare } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useChat } from '@ai-sdk/react';
import { Response } from '@/components/ai-elements/response';
import { lastAssistantMessageIsCompleteWithToolCalls, UIMessage } from 'ai';
import { DynamicForm } from '@/components/dynamicform';
import { Loader } from '@/components/ai-elements/loader';


const ConversationDemo = () => {
  const [input, setInput] = useState('');

   const conversationId = "conv_import_001";
  const { messages, sendMessage, status,addToolResult,setMessages } = useChat({
     sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
    async onToolCall({ toolCall }) {
      if (toolCall.dynamic) return
    },
    async onFinish(props){
      console.log(props)
      const message=props.message
   fetch("/api/db", {
  method: "POST",
  body: JSON.stringify({
    id: message.id,
    role: message.role,
    parts: message.parts,
    conversation_id: conversationId,
  }),
  
});


    },
  });
useEffect(() => {
  async function load() {
    const res = await fetch("/api/db");
    const data = await res.json();
    console.log(data)
    setMessages(data);
  }
  load();
}, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      sendMessage({ text: input });
      setInput('');
    }
  };
  console.log(messages)

  return (
    <div className="max-w-4xl mx-auto p-6 relative size-full rounded-lg border h-[90vh]">
      <div className="flex flex-col h-full">
        <Conversation >
          <ConversationContent >
            {messages.length === 0 ? (
              <ConversationEmptyState
                icon={<MessageSquare className="size-12" />}
                title="Start a conversation"
                description="Type a message below to begin chatting"
              />
            ) : (
              messages.map((message) => (
                <Message from={message.role} key={message.id}>
                  <MessageContent>
                    {message.parts.map((part:any, i) => {
                      switch (part.type) {
                        case 'text': // we don't use any reasoning or tool calls in this example
                          return (
                            <Response key={`${message.id}-${i}`}>
                              {part.text}
                            </Response>
                          );
                          
                                            case 'tool-dynamicformfields': {
                                              const callId = part.toolCallId
                          
                                              switch (part.state) {
                                                case 'input-streaming':
                                                  console.log('input-streaming',part.input)
                                                  return (
                                                    <div
                                                      key={callId}
                                                      className="text-muted-foreground italic"
                                                    >
                                                      Loading form...
                                                    </div>
                                                  )
                          
                                                case 'input-available':
                                                  return (
                                                    <div key={callId} className="mt-4">
                                                      <DynamicForm
                                                        fields={part.input.fields}
                                                        title={part.input.title}
                                                        description={part.input.description}
                                                        onSubmit={(data: any) => {
                                                          
                                                          addToolResult({
                                                            tool: 'dynamicformfields',
                                                            toolCallId: callId,
                                                            output: data,
                                                          })
                                                        }}
                                                          theme={{
                                    primaryColor: "bg-black hover:bg-gray-700",
                                    backgroundColor: "bg-gray-50",
                                    textColor: "text-gray-800",
                                    borderColor: "border-gray-400",
                                    destructiveColor: "text-red-500",
                                    mutedTextColor: "text-gray-500",
                                  }}
                                
                                                      />
                                                    </div>
                                                  )
                          
                                                case 'output-available':
                                                  console.log()
                                                  return (
                                                     <div key={callId} className="mt-4 flex flex-col gap-3">
                                                      <div
                                                      key={callId}
                                                      className="text-green-600 font-medium"
                                                    >
                                                      ✅ Form submitted successfully
                                                    </div>
                                                      <DynamicForm
                                                        fields={part.input.fields}
                                                        title={part.input.title}
                                                        description={part.input.description}
                                                        onSubmit={(data: any) => {
                                                          
                                                          addToolResult({
                                                            tool: 'dynamicformfields',
                                                            toolCallId: callId,
                                                            output: data,
                                                          })
                                                        }}
                                                          theme={{
                                    primaryColor: "bg-black hover:bg-gray-700",
                                    backgroundColor: "bg-gray-50",
                                    textColor: "text-gray-800",
                                    borderColor: "border-gray-400",
                                    destructiveColor: "text-red-500",
                                    mutedTextColor: "text-gray-500",
                                  }}
                                  formSubmitted={true}
                                  initialValues={part.output}
                                
                                                      />
                                                    </div>
                                                    
                                                  )
                          
                                                // case 'output-error':
                                                //   return (
                                                //     <div key={callId} className="text-destructive">
                                                //       ⚠️ Error: {part.errorText}
                                                //     </div>
                                                //   )
                                              }
                                              break
                                            }
                        default:
                          return null;
                      }
                    })}
                  </MessageContent>
                </Message>
              ))
            )}
             {status === 'submitted' && <Loader />}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>

        <PromptInput
          onSubmit={(message, e) => handleSubmit(e)}
          className="mt-4 w-full max-w-2xl mx-auto relative"
        >
          <PromptInputTextarea
            value={input}
            placeholder="Say something..."
            onChange={(e) => setInput(e.currentTarget.value)}
            className="pr-12"
          />
          <PromptInputSubmit
            status={status === 'streaming' ? 'streaming' : 'ready'}
            disabled={!input.trim()}
            className="absolute bottom-1 right-1"
          />
        </PromptInput>
      </div>
    </div>
  );
};

export default ConversationDemo;