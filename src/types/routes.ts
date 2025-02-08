// Inference Mode Routes
export type InferenceRoute = 'new-chat' | 'new-agent' | 'browse-agents';

// Operator Mode Routes
export type OperatorRoute = 'configuration' | 'connections' | 'status';

// Combined Route Type
export type Route = InferenceRoute | OperatorRoute; 