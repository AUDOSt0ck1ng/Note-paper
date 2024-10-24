from fastapi import FastAPI, HTTPException
import os
from pydantic import BaseModel
from openai import AsyncOpenAI
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict
import uvicorn

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 在生產環境中應該設置為特定域名
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 設置OpenAI API金鑰
api_client = AsyncOpenAI(
    api_key=os.getenv("OPENAI_API_KEY")
)

class ChatMessages(BaseModel):
    messages: List[Dict[str, str]] 

async def llm_chat(messages: List[Dict[str, str]]):
    response = await api_client.chat.completions.create(
        model=os.getenv("LLM_MODEL"),
        messages=messages
    )
    return response

@app.post("/api/chat")
async def chat(chat_message: ChatMessages):
    try:
        # 使用OpenAI API進行對話
        response = await llm_chat(ChatMessages.messages)
        # 提取AI的回覆
        ai_reply = f'{response.choices[0].message.content} \n(total tokens: {response.usage.total_tokens})'
        
        return {"reply": ai_reply}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=3000)
