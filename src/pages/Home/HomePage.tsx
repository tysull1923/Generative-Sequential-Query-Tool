import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MessageSquarePlus, Trash2, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Banner/MainBanner/MainHeader';
import { ChatApiService } from '@/services/database/chatDatabaseApiService';
import  ChatHistoryCard from '@/components/features/ChatHistory/HistoricalChatCard'
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/Alert-dialog";
import { ChatDocument } from '@/utils/types/chat.types';

function HomePage() {
	const navigate = useNavigate();
	const [chats, setChats] = useState<ChatDocument[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [deleteChat, setDeleteChat] = useState<ChatDocument>();
	const chatService = ChatApiService.getInstance();

	// Fetch chats on component mount
	useEffect(() => {
		fetchChats();
	}, []);

	const fetchChats = async () => {
		try {
			setLoading(true);
			const chatData = await chatService.listChats();
			setChats(chatData);
			setError("");
		} catch (err) {
			setError('Failed to load chats. Please try again.');
			console.error('Error fetching chats:', err);
		} finally {
			setLoading(false);
		}
	};

	const handleDeleteChat = async (chatId: string) => {
		try {
			await chatService.deleteChat(chatId);
			setChats(chats.filter(chat => chat._id !== chatId));
			setDeleteChat(undefined);
		} catch (err) {
			console.error('Error deleting chat:', err);
			setError('Failed to delete chat. Please try again.');
		}
	};

  const navigateToChat = (chatId) => {
    navigate('/chat', { state: { chatId } });
  };
  const handleCopyChat = async (chatId) => {
    try {
      const newChatId = await chatService.copyChat(chatId);
      // Refresh the chat list to show the new copy
      await fetchChats();
    } catch (err) {
      console.error('Error copying chat:', err);
      setError('Failed to copy chat. Please try again.');
    }
  };

	if (loading) {
		return (
			<div className="min-h-screen bg-gray-100">
				<Header />
				<div className="flex items-center justify-center h-64">
					<Loader2 className="h-8 w-8 animate-spin text-gray-500" />
				</div>
			</div>
		);
	}

	return (
		<main className="container mx-auto px-4 py-8">
			<div className="flex justify-between items-center mb-8">
				<h1 className="text-2xl font-bold">Your Chats</h1>
				<Button onClick={() => navigate('/chat')} className="flex items-center" size="lg">
					<MessageSquarePlus className="mr-2 h-4 w-4" />
					New Chat
				</Button>
			</div>

			{error && (
				<Alert variant="destructive" className="mb-6">
					<AlertDescription>{error}</AlertDescription>
				</Alert>
			)}

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {chats.map((chat) => (
            <ChatHistoryCard
              key={chat._id}
              chat={chat}
              onDelete={(chatId) => setDeleteChat(chat)}
              onCopy={handleCopyChat}
            />
          ))}
        </div>
        {/* <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {chats.map((chat) => (
            <Card 
              key={chat._id} 
              className="hover:shadow-lg transition-shadow cursor-pointer"
            >
              <div onClick={() => navigateToChat(chat._id)}>
                <CardHeader>
                  <CardTitle className="text-lg">{chat.title || 'Untitled Chat'}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">
                      {chat.settings?.savingParams?.summary || 'No summary available'}
                    </p>
                    <div className="flex gap-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {chat.settings?.chatType || 'Base Chat'}
                      </span>
                      {chat.settings?.selectedApi && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {chat.settings.selectedApi}
                        </span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </div>
              <CardFooter className="flex justify-between items-center">
                <span className="text-sm text-gray-500">
                  {new Date(chat.createdAt).toLocaleDateString()}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteChat(chat);
                  }}
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div> */}

        <AlertDialog open={!!deleteChat} onOpenChange={() => setDeleteChat(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Chat</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this chat? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteChat && handleDeleteChat(deleteChat._id)}
                className="bg-red-500 hover:bg-red-600"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
  );
};

export default HomePage;


// import { Button } from '@/components/ui/button';
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// import { Settings, MessageSquarePlus, History, Plus } from 'lucide-react';
// import { useNavigate } from 'react-router-dom';
// //import ChatPage from './chat';
// import Header from '@/components/Banner/MainBanner/MainHeader';

// import {
// 	Select,
// 	SelectContent,
// 	SelectItem,
// 	SelectTrigger,
// 	SelectValue,
// } from "@/components/ui/select";
// //import MainBanner from '@/components/Banner/MainBanner/MainBanner';

// const HomePage = () => {
// 	const navigate = useNavigate();
// 	const chatHistory = [
// 		{ id: 1, title: "Product Analysis", date: "2025-01-01", queries: 5 },
// 		{ id: 2, title: "Market Research", date: "2025-01-01", queries: 3 },
// 		{ id: 3, title: "Content Generation", date: "2024-12-31", queries: 7 }
// 	];


// 	return (
// 		<div className="min-h-screen bg-gray-100">

// 			{/* Top Banner */}
// 			<Header />

// 			{/* Main Content */}
// 			<main className="container mx-auto px-4 py-8">
// 				<div className="flex justify-between items-center mb-8">
// 					{/* <div className="flex space-x-4">
//             <Select>
//               <SelectTrigger className="w-[180px]">
//                 <SelectValue placeholder="Select API" />
//               </SelectTrigger>
//               <SelectContent>
//                 <SelectItem value="openai">OpenAI</SelectItem>
//                 <SelectItem value="claude">Claude</SelectItem>
//                 <SelectItem value="both">Both</SelectItem>
//               </SelectContent>
//             </Select>
			
			
//           </div>  */}


// 					<Button onClick={() => navigate('/base-chat')} className="flex items-center" size="lg">
// 						<Plus className="mr-2 h-4 w-4" />
// 						New Chat
// 					</Button>
// 				</div>

// 				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
// 					{chatHistory.map((chat) => (
// 						<Card key={chat.id} className="hover:shadow-lg transition-shadow">
// 							<CardHeader>
// 								<CardTitle className="text-lg">{chat.title}</CardTitle>
// 							</CardHeader>
// 							<CardContent>
// 								<div className="flex justify-between text-sm text-gray-500">
// 									<span>{chat.date}</span>
// 									<span>{chat.queries} queries</span>
// 								</div>
// 							</CardContent>
// 						</Card>
// 					))}
// 				</div>
// 			</main>
// 		</div>
// 	);
// };

// export default HomePage;