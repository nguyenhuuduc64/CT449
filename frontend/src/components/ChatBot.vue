<template>
  <div class="chatbot-wrapper">
    <div v-if="!isOpen" @click="toggleChat" class="chat-icon">
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path>
      </svg>
      <div v-if="trainingContext" class="training-badge">📚</div>
    </div>

    <div v-if="isOpen" class="chat-container">
      <div class="chat-header">
        <h3>🤖 Trợ Lý Thư Viện</h3>
        <div class="header-actions">
          <button @click="clearHistory" title="Xóa lịch sử" class="clear-btn">
            🗑️
          </button>
          <button @click="toggleChat" class="close-btn">
            ✕
          </button>
        </div>
      </div>

      <div ref="messagesContainer" class="messages">
        <div v-for="(msg, index) in messages" :key="index" class="message-wrapper">
          <div :class="['message', msg.sender === 'user' ? 'user-message' : 'bot-message']">
            {{ msg.text }}
          </div>
        </div>
        <div v-if="isLoading" class="message bot-message">
          <div class="loading-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </div>

      <div class="input-area">
        <input
          v-model="input"
          @keyup.enter="sendMessage"
          type="text"
          placeholder="Nhập tên sách hoặc câu hỏi..."
          :disabled="isLoading"
        />
        <button @click="sendMessage" :disabled="!input.trim() || isLoading">
          <span v-if="!isLoading">Gửi</span>
          <svg v-else class="spinner" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick, watch, onMounted } from 'vue'

const input = ref('')
const messages = ref([])
const isLoading = ref(false)
const messagesContainer = ref(null)
const isOpen = ref(false)
const conversationHistory = ref([])

// === SỬA API CONFIG ===
const API_KEY = import.meta.env.VITE_API_GEMINI_KEY;
const MODEL_NAME = 'gemini-2.5-flash' // Sửa model name đúng
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent`

const trainingContext = ref('')
const isLoadingFile = ref(false)

watch(messages, async () => {
  await nextTick()
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}, { deep: true })

function toggleChat() {
  isOpen.value = !isOpen.value
}

function clearHistory() {
  conversationHistory.value = []
  messages.value = [{
    sender: 'bot',
    text: 'Xin chào! Tôi là trợ lý thư viện. Bạn muốn biết nội dung chính của quyển sách nào? 📚',
    timestamp: new Date()
  }]
}

onMounted(() => {
  // Câu đầu tiên khi mở chatbot
  messages.value.push({
    sender: 'bot',
    text: 'Xin chào! Tôi là trợ lý thư viện. Bạn muốn biết nội dung chính của quyển sách nào? 📚',
    timestamp: new Date()
  })
  
  loadTrainingFile()
})

async function loadTrainingFile() {
  isLoadingFile.value = true
  try {
    const data = await window.fs.readFile('./training.txt', { encoding: 'utf8' })
    trainingContext.value = data
    console.log('✅ Đã tải file training thành công')
  } catch (error) {
    console.log('⚠️ Không tìm thấy file training.txt, sử dụng kiến thức mặc định')
    // Kiến thức mặc định về sách
    trainingContext.value = `
THƯ VIỆN SÁCH PHỔ BIẾN:

1. Sách Văn Học:
   - "Tắt Đèn" (Ngô Tất Tố): Tác phẩm tố cáo chế độ sưu thuế phong kiến, xoay quanh gia đình chị Dậu.
   - "Chí Phèo" (Nam Cao): Câu chuyện về bi kịch của người nông dân bị tha hóa và khát vọng lương thiện.
   - "Số Đỏ" (Vũ Trọng Phụng): Tiểu thuyết trào phúng phê phán xã hội thành thị tư sản đương thời.

2. Sách Khoa Học:
   - "Vũ Trụ Trong Vỏ Hạt Dẻ" (Stephen Hawking): Giải thích vũ trụ học hiện đại.
   - "Lược Sử Thời Gian" (Stephen Hawking): Khám phá bản chất của vũ trụ.

3. Sách Kỹ Năng:
   - "Đắc Nhân Tâm" (Dale Carnegie): Nghệ thuật thu phục lòng người.
   - "7 Thói Quen Hiệu Quả" (Stephen Covey): Phương pháp phát triển bản thân.

4. Sách Kinh Tế:
   - "Nhà Đầu Tư Thông Minh" (Benjamin Graham): Cẩm nang đầu tư giá trị.
   - "Cha Giàu Cha Nghèo" (Robert Kiyosaki): Tư duy tài chính.

HÃY TRẢ LỜI:
- Giới thiệu ngắn gọn về nội dung chính
- Tác giả và năm xuất bản
- Ý nghĩa/giá trị của tác phẩm
- Đối tượng độc giả phù hợp
- Nếu không biết sách đó, hãy hỏi rõ hơn hoặc gợi ý sách tương tự
`
  } finally {
    isLoadingFile.value = false
  }
}

function buildConversationHistory() {
  if (conversationHistory.value.length === 0) {
    return 'Đây là câu hỏi đầu tiên trong cuộc trò chuyện.'
  }
  
  const recentHistory = conversationHistory.value.slice(-10)
  let historyText = 'Lịch sử cuộc trò chuyện:\n\n'
  recentHistory.forEach(item => {
    historyText += `${item.sender === 'user' ? 'Người dùng' : 'Bot'}: ${item.text}\n`
  })
  
  return historyText
}

async function sendMessage() {
  if (!input.value.trim() || isLoading.value) return

  // Kiểm tra API key
  if (!API_KEY || !API_KEY.startsWith('AIza')) {
    messages.value.push({
      sender: 'bot',
      text: '❌ Lỗi: API Key không hợp lệ hoặc chưa được cấu hình. Vui lòng kiểm tra file .env',
      timestamp: new Date()
    })
    input.value = ''
    return
  }

  const userMessage = input.value.trim()
  const userMessageObj = {
    sender: 'user',
    text: userMessage,
    timestamp: new Date()
  }
  
  messages.value.push(userMessageObj)
  conversationHistory.value.push(userMessageObj)
  
  input.value = ''
  isLoading.value = true

  try {
    const historyContext = buildConversationHistory()
    
    // SYSTEM PROMPT CHO TRỢ LÝ THƯ VIỆN
    let systemPrompt = `Bạn là trợ lý thư viện thông minh. Nhiệm vụ của bạn:

1. HỎI NGAY KHI BẮT ĐẦU: "Bạn muốn biết nội dung chính của quyển sách nào?"
2. KHI NGƯỜI DÙNG HỎI VỀ SÁCH:
   - Giới thiệu ngắn gọn nội dung chính (2-3 câu)
   - Tác giả, năm xuất bản (nếu biết)
   - Thể loại và chủ đề
   - Đối tượng độc giả phù hợp
   - Ý nghĩa/giá trị tác phẩm
3. NẾU KHÔNG BIẾT SÁCH ĐÓ:
   - Hỏi rõ hơn: "Bạn có thể cho biết tên tác giả không?"
   - Gợi ý sách tương tự
   - Đề xuất sách cùng thể loại
4. PHONG CÁCH:
   - Thân thiện, nhiệt tình
   - Sử dụng emoji sách 📚
   - Trả lời bằng tiếng Việt tự nhiên
   - Ngắn gọn, dễ hiểu

BẮT ĐẦU BẰNG: "Xin chào! Tôi là trợ lý thư viện. Bạn muốn biết nội dung chính của quyển sách nào? 📚"`
    
    if (trainingContext.value) {
      systemPrompt = `Bạn là trợ lý thư viện thông minh.

KIẾN THỨC THƯ VIỆN:
${trainingContext.value.substring(0, 10000)}

QUY TẮC TRẢ LỜI:
1. LUÔN BẮT ĐẦU bằng câu: "Bạn muốn biết nội dung chính của quyển sách nào?"
2. Với mỗi cuốn sách được hỏi, cung cấp:
   - Nội dung chính (2-3 câu)
   - Tác giả và năm xuất bản
   - Thể loại sách
   - Đối tượng độc giả phù hợp
   - Giá trị/ý nghĩa tác phẩm
3. Nếu không biết sách: hỏi thêm thông tin hoặc gợi ý sách tương tự
4. Trả lời bằng tiếng Việt, thân thiện, sử dụng emoji 📚
5. Giữ câu trả lời ngắn gọn, dễ hiểu

BẮT ĐẦU: "Xin chào! Tôi là trợ lý thư viện. Bạn muốn biết nội dung chính của quyển sách nào? 📚"`
    }

    const prompt = `${systemPrompt}

${historyContext}

Câu hỏi của người dùng: "${userMessage}"

Hãy trả lời với tư cách trợ lý thư viện:`

    const response = await fetch(`${API_URL}?key=${API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          role: "user",
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: 0.7,
          topP: 0.9,
          topK: 40,
          maxOutputTokens: 1000,
        }
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Lỗi API:', response.status, errorText)
      throw new Error(`HTTP ${response.status}: ${errorText}`)
    }

    const data = await response.json()
    let botReply = "Xin lỗi, tôi không thể tìm thấy thông tin về sách này."
    
    if (data.candidates && data.candidates[0]) {
      botReply = data.candidates[0].content?.parts?.[0]?.text || botReply
      botReply = botReply.trim()
      
      // Đảm bảo không lặp lại câu chào nếu đã có trong lịch sử
      if (conversationHistory.value.length > 2 && botReply.includes('Xin chào! Tôi là trợ lý thư viện')) {
        botReply = botReply.replace('Xin chào! Tôi là trợ lý thư viện. ', '')
      }
    }

    const botMessageObj = {
      sender: 'bot',
      text: botReply,
      timestamp: new Date()
    }
    
    messages.value.push(botMessageObj)
    conversationHistory.value.push(botMessageObj)

  } catch (err) {
    console.error('Lỗi trong sendMessage:', err)
    
    let errorMessage = 'Xin lỗi, tôi đang gặp sự cố kỹ thuật. Vui lòng thử lại sau.'
    
    if (err.message.includes('API key')) {
      errorMessage = '❌ Lỗi kết nối API. Vui lòng kiểm tra API Key trong file .env'
    } else if (err.message.includes('network')) {
      errorMessage = '🌐 Lỗi kết nối mạng. Vui lòng kiểm tra internet.'
    }
    
    messages.value.push({
      sender: 'bot',
      text: errorMessage,
      timestamp: new Date()
    })
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
.chatbot-wrapper {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 1000;
}

.chat-icon {
  width: 56px;
  height: 56px;
  background: #8b5cf6; /* Màu tím cho thư viện */
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.4);
  transition: all 0.3s ease;
  color: white;
}

.chat-icon:hover {
  background: #7c3aed;
  transform: scale(1.1);
  box-shadow: 0 6px 16px rgba(139, 92, 246, 0.5);
}

.training-badge {
  position: absolute;
  top: -5px;
  right: -5px;
  background: #10b981;
  color: white;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.chat-container {
  width: 400px; /* Rộng hơn một chút */
  height: 600px; /* Cao hơn một chút */
  background: white;
  border-radius: 16px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid #e5e7eb;
}

.chat-header {
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
  color: white;
  padding: 18px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chat-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.clear-btn, .close-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  cursor: pointer;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  transition: all 0.2s;
}

.clear-btn:hover, .close-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: scale(1.1);
}

.messages {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
}

.message-wrapper {
  margin-bottom: 16px;
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.message {
  padding: 12px 16px;
  border-radius: 18px;
  max-width: 85%;
  word-wrap: break-word;
  line-height: 1.5;
  font-size: 14px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.user-message {
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
  color: white;
  margin-left: auto;
  border-bottom-right-radius: 4px;
}

.bot-message {
  background: white;
  color: #374151;
  border: 1px solid #e5e7eb;
  border-bottom-left-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.loading-dots {
  display: flex;
  gap: 6px;
  align-items: center;
  padding: 8px 0;
}

.loading-dots span {
  width: 10px;
  height: 10px;
  background: #8b5cf6;
  border-radius: 50%;
  animation: bounce 1.4s infinite ease-in-out;
}

.loading-dots span:nth-child(1) { animation-delay: -0.32s; }
.loading-dots span:nth-child(2) { animation-delay: -0.16s; }

@keyframes bounce {
  0%, 80%, 100% { 
    transform: scale(0);
    opacity: 0.5;
  }
  40% { 
    transform: scale(1);
    opacity: 1;
  }
}

.input-area {
  padding: 20px;
  background: white;
  border-top: 1px solid #e5e7eb;
  display: flex;
  gap: 12px;
  align-items: center;
}

.input-area input {
  flex: 1;
  padding: 12px 16px;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  outline: none;
  font-size: 14px;
  transition: all 0.2s;
  background: #f9fafb;
}

.input-area input:focus {
  border-color: #8b5cf6;
  background: white;
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
}

.input-area input:disabled {
  background: #f3f4f6;
  cursor: not-allowed;
}

.input-area button {
  padding: 12px 24px;
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
  color: white;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 70px;
  box-shadow: 0 4px 6px rgba(139, 92, 246, 0.2);
}

.input-area button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(139, 92, 246, 0.3);
}

.input-area button:active:not(:disabled) {
  transform: translateY(0);
}

.input-area button:disabled {
  background: #d1d5db;
  cursor: not-allowed;
  box-shadow: none;
}

.spinner {
  width: 20px;
  height: 20px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.messages::-webkit-scrollbar {
  width: 8px;
}

.messages::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 4px;
}

.messages::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 4px;
}

.messages::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}
</style>