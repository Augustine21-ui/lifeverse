// backend/src/controllers/focusController.js
import { getAI, isAIAvailableCheck, getAIProvider, generateMockResponse } from '../utils/aiUtils.js';

export const getFocusSuggestion = async (req, res) => {
  try {
    const { topic, subject } = req.body;
    
    if (!isAIAvailableCheck()) {
      return res.json({
        suggestion: generateMockResponse('focus', topic || subject || 'studying'),
        mock: true
      });
    }

    const { openai, aiProvider } = getAI();
    const completion = await openai.chat.completions.create({
      model: aiProvider === 'groq' ? "llama-3.3-70b-versatile" : "gpt-3.5-turbo",
      messages: [
        { role: 'system', content: 'You are a focus coach. Provide brief, actionable focus tips.' },
        { role: 'user', content: `Give me a focus tip for studying ${topic || subject || 'general'}` }
      ],
      max_tokens: 150,
    });

    res.json({
      suggestion: completion.choices[0].message.content,
      mock: false
    });
  } catch (error) {
    console.error('Focus suggestion error:', error);
    res.json({
      suggestion: generateMockResponse('focus', req.body.topic || 'studying'),
      mock: true
    });
  }
};

// backend/src/controllers/focusController.js
// Add this function at the end of the file

export const generateResources = async (req, res) => {
  try {
    const { topic } = req.body;
    
    if (!topic) {
      return res.status(400).json({ error: 'Topic is required' });
    }

    // Mock resources for now
    const resources = {
      articles: [
        { 
          title: `Introduction to ${topic}`,
          description: `A beginner-friendly guide to understanding ${topic}`,
          url: '#',
          type: 'article',
          difficulty: 'beginner'
        },
        { 
          title: `Advanced ${topic} Concepts`,
          description: `Deep dive into complex ${topic} topics`,
          url: '#',
          type: 'article',
          difficulty: 'advanced'
        }
      ],
      videos: [
        { 
          title: `${topic} Explained in 5 Minutes`,
          description: `Quick video overview of ${topic}`,
          url: '#',
          type: 'video',
          duration: '5:00'
        },
        { 
          title: `Mastering ${topic}: Full Tutorial`,
          description: `Comprehensive tutorial on ${topic}`,
          url: '#',
          type: 'video',
          duration: '25:00'
        }
      ],
      exercises: [
        { 
          title: `${topic} Practice Problems`,
          description: `Practice your ${topic} skills`,
          url: '#',
          type: 'exercise',
          difficulty: 'intermediate'
        }
      ],
      study_guides: [
        { 
          title: `${topic} Study Guide`,
          description: `Complete study guide for ${topic}`,
          url: '#',
          type: 'study_guide'
        }
      ]
    };

    // Try to use AI if available, but fallback to mock
    try {
      // Check if AI is available (this will be added later)
      if (process.env.GROQ_API_KEY && process.env.GROQ_API_KEY !== 'your_groq_api_key_here') {
        // AI call would go here
        // For now, just use mock
        console.log('ℹ️ AI available, but using mock for now');
      }
    } catch (aiError) {
      console.warn('AI not available, using mock resources');
    }

    res.json({
      success: true,
      resources: resources,
      mock: true,
      message: 'Resources generated successfully'
    });
  } catch (error) {
    console.error('Error generating resources:', error);
    res.status(500).json({ 
      error: 'Failed to generate resources',
      message: error.message 
    });
  }
};