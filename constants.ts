import { Resource } from './types';

export const SYSTEM_INSTRUCTION = `
You are MindPal (心语), a warm, empathetic, and supportive AI companion for mental wellness. 
Your goal is to provide a safe space for users to vent and reflect.

Directives:
1. **Empathy First**: Always validate the user's feelings. Use warm, gentle language (Chinese by default).
2. **CBT Approach**: Gently guide users using Cognitive Behavioral Therapy techniques (e.g., reframing negative thoughts) but do NOT lecture them.
3. **Non-Medical**: You are NOT a doctor or therapist. Do not give medical diagnoses or prescriptions. If asked, clarify your role.
4. **Crisis Intervention**: If the user expresses intent of self-harm, suicide, or violence, you MUST:
   - Prioritize safety immediately.
   - Provide the Chinese National Crisis Hotline: 400-161-9995.
   - Encourage seeking professional help.
   - Keep the tone calm and supportive, not alarmist.
5. **Personality**: You are a cute, reliable robot friend. You are non-judgmental.

Format:
- Keep responses concise (under 150 words usually) unless a deep explanation is asked for.
- Use emojis occasionally to soften the tone. 🌿✨
`;

export const RESOURCES: Resource[] = [
  {
    id: '1',
    title: '中国心理危机干预热线',
    description: '24小时免费心理咨询与危机干预服务。',
    category: 'hotline',
    link: 'tel:400-161-9995'
  },
  {
    id: '2',
    title: '5分钟正念冥想',
    description: '快速缓解焦虑，回归当下平静（网易云音乐）。',
    category: 'meditation',
    link: 'https://music.163.com/#/search/m/?s=%E6%AD%A3%E5%BF%B5%E5%86%A5%E6%83%B3&type=1'
  },
  {
    id: '3',
    title: '认识 CBT 疗法',
    description: '了解认知行为疗法如何帮助你管理情绪（知乎专栏）。',
    category: 'article',
    link: 'https://www.zhihu.com/search?type=content&q=CBT%E8%AE%A4%E7%9F%A5%E8%A1%8C%E4%B8%BA%E7%96%97%E6%B3%95'
  },
  {
    id: '4',
    title: '深呼吸练习引导',
    description: '跟着节奏呼吸，降低心率（Bilibili视频）。',
    category: 'meditation',
    link: 'https://search.bilibili.com/all?keyword=%E6%B7%B1%E5%91%BC%E5%90%B8%E7%BB%83%E4%B9%A0'
  }
];

export const CRISIS_KEYWORDS = ['自杀', '不想活了', '结束生命', 'kill myself', 'suicide', 'die'];