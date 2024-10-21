from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import uvicorn
from openai import AsyncOpenAI
import os
from fastapi.middleware.cors import CORSMiddleware

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

class ChatMessage(BaseModel):
    message: str

@app.post("/api/chat")
async def chat(chat_message: ChatMessage):
    try:
        # 使用OpenAI API進行對話
        response = await api_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "你是一個文件整理助手。"},
                {"role": "user", "content": chat_message.message}
            ]
        )
        
        # 提取AI的回覆
        ai_reply = f'{response.choices[0].message.content} \n(total tokens: {response.usage.total_tokens})'
        
        return {"reply": ai_reply}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=3000)
