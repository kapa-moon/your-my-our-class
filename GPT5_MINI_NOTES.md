# GPT-5-Mini API Requirements

When using the `gpt-5-mini` model with OpenAI API, note these important restrictions:

## ❌ What NOT to Use

1. **Temperature Parameter**
   - ❌ `temperature: 0.7` (or any value other than 1)
   - ✅ Don't include temperature parameter (uses default of 1)
   
2. **Max Tokens Parameter**
   - ❌ `max_tokens: 300`
   - ✅ `max_completion_tokens: 300`

## ✅ Correct API Call Format

```typescript
const response = await openai.chat.completions.create({
  model: 'gpt-5-mini',
  max_completion_tokens: 500, // Use max_completion_tokens, NOT max_tokens
  messages: [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ],
  // No temperature parameter - only supports default value of 1
  response_format: { type: 'json_object' }, // This is fine to include
});
```

## Files Updated

All files using `gpt-5-mini` have been updated:

1. ✅ `/api/persona-playground/conversation/[id]/moderate/route.ts`
2. ✅ `/api/persona-playground/conversation/[id]/generate-utterance/route.ts` (2 places)
3. ✅ `/api/persona-playground/match-classmates/route.ts`
4. ✅ `/api/chatbot/route.ts`
5. ✅ `/api/persona-interactions/route.ts`

## Error Messages to Watch For

If you see these errors, check your API parameters:

```
400 Unsupported value: 'temperature' does not support 0.7 with this model
→ Remove temperature parameter

400 Unsupported parameter: 'max_tokens' is not supported with this model
→ Use max_completion_tokens instead
```

## When to Use gpt-5-mini vs gpt-4o-mini

- **gpt-5-mini**: Newer model, more restrictive parameters, potentially better performance
- **gpt-4o-mini**: More flexible parameters (supports custom temperature, max_tokens)

If you need custom temperature values for your use case, consider switching back to `gpt-4o-mini`.

