import { useEffect } from "react";
import { useChatStore } from "../store/useChatStore";
import { useGroupStore } from "../store/useGroupStore";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";

import Sidebar from "../components/Sidebar";
import NoChatSelected from "../components/NoChatSelected";
import ChatContainer from "../components/ChatContainer";

const HomePage = () => {
  const { selectedUser } = useChatStore();
  const { selectedGroup } = useGroupStore();

  // Check if either a user or a group is selected
  const isChatSelected = !!selectedUser || !!selectedGroup;

  return (
    <div className="min-h-screen bg-gradient-to-br from-base-300 to-base-100 pt-16">
      <div className="container mx-auto flex items-center justify-center py-6 px-4">
        <div className="bg-base-100 rounded-xl shadow-xl w-full max-w-7xl h-[80vh] overflow-hidden border border-base-300">
          <div className="flex h-full overflow-hidden">
            <Sidebar />
            {!isChatSelected ? <NoChatSelected /> : <ChatContainer />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
