import { generateText } from "ai"
import { createOpenAI } from '@ai-sdk/openai'
import { NextResponse } from "next/server";

const ollama = createOpenAI({
    baseURL: 'http://localhost:11434/v1',
    apiKey: 'ollama',
});

export async function POST(request: Request){

    const result = await generateText({
        model: ollama.chat('llama3.2'), 
        
        system: 'Você é um assistente de IA que responde perguntas de forma Humoristica e curiosa',
        prompt: 'quanto é 2+2, e porque?',
    })

    return NextResponse.json({ message: result.text })
}