import { useEffect, useState } from 'react';
import { TbMessages } from "react-icons/tb";
import { FiSend } from "react-icons/fi";
import catIcons from '@/utils/categories';
import difficulties from '@/utils/difficulties';
import api from '@/lib/api';
import './Support.css';
import { Link } from 'react-router-dom';
import AutoGrowTextarea from '@/components/AutoGrowTextarea/AutoGrowTextarea';
import { IoSend } from 'react-icons/io5';
import { Avatar } from '@mui/material';

type ConversationData = {
    id: number;
    title: string;
    type: string;
    objId: number;
    category: {
        id: number;
        name: string;
        shortForm: string;
    };
    lastMessage: string;
    lastSender: string;
};

type Props = {
    isNew: boolean;
}

function Support({ isNew } : Props) {
    const [currentPage, setCurrentPage] = useState(1);
    const [conversations, setConversations] = useState<ConversationData[]>([]);
    const [msgInput, setMsgInput] = useState("");
    const [tab, setTab] = useState(0);

    const fetchConversations = async (closed: boolean) => {
        await api.get("/Support/Conversations", { params: { page: currentPage, closed: closed } })
            .then(resp => {
                setConversations(resp.data.conversations);
            })
            .catch(() => {});
    };

    useEffect(() => {
        setCurrentPage(1);
        fetchConversations(false);
    }, []);

    return (
        <div className="support">
            <div className="support-left">
                <div className="support-tabs">
                    <div className="support-tab" onClick={() => setTab(0)}>Active</div>
                    <div className="support-tab" onClick={() => setTab(1)}>Closed</div>
                    <div className="support-tab-active" style={{ left: `${tab * 50}%`}}></div>
                </div>
                <div className="support-list">
                    <div className="support-item">
                        <img src={catIcons["pwn"]} />
                        <div className="support-subitem">
                            <h2>Challenge: <strong>Basic Web</strong> <i>#1</i></h2>
                            <p>lazarm: Hello world all to you guys</p>
                        </div>
                    </div>
                    <div className="support-item support-active-item">
                        <img src={catIcons["pwn"]} />
                        <div className="support-subitem">
                            <h2>Challenge: <strong>Basic Web</strong> <i>#1</i></h2>
                            <p>lazarm: Hello world all to you guys</p>
                        </div>
                    </div>
                    <div className="support-item">
                        <img src={catIcons["pwn"]} />
                        <div className="support-subitem">
                            <h2>Challenge: <strong>Basic Web</strong> <i>#1</i></h2>
                            <p>lazarm: Hello world all to you guys</p>
                        </div>
                    </div>
                    <div className="support-item">
                        <img src={catIcons["pwn"]} />
                        <div className="support-subitem">
                            <h2>Challenge: <strong>Basic Web</strong> <i>#1</i></h2>
                            <p>lazarm: Hello world all to you guys</p>
                        </div>
                    </div>
                    <div className="support-item">
                        <img src={catIcons["pwn"]} />
                        <div className="support-subitem">
                            <h2>Challenge: <strong>Basic Web</strong> <i>#1</i></h2>
                            <p>lazarm: Hello world all to you guys</p>
                        </div>
                    </div>
                    <div className="support-item">
                        <img src={catIcons["pwn"]} />
                        <div className="support-subitem">
                            <h2>Challenge: <strong>Basic Web</strong> <i>#1</i></h2>
                            <p>lazarm: Hello world all to you guys</p>
                        </div>
                    </div>
                    <div className="support-item">
                        <img src={catIcons["pwn"]} />
                        <div className="support-subitem">
                            <h2>Challenge: <strong>Basic Web</strong> <i>#1</i></h2>
                            <p>lazarm: Hello world all to you guys</p>
                        </div>
                    </div>
                    <div className="support-item">
                        <img src={catIcons["pwn"]} />
                        <div className="support-subitem">
                            <h2>Challenge: <strong>Basic Web</strong> <i>#1</i></h2>
                            <p>lazarm: Hello world all to you guys</p>
                        </div>
                    </div>
                    <div className="support-item">
                        <img src={catIcons["pwn"]} />
                        <div className="support-subitem">
                            <h2>Challenge: <strong>Basic Web</strong> <i>#1</i></h2>
                            <p>lazarm: Hello world all to you guys</p>
                        </div>
                    </div>
                    <div className="support-item">
                        <img src={catIcons["pwn"]} />
                        <div className="support-subitem">
                            <h2>Challenge: <strong>Basic Web</strong> <i>#1</i></h2>
                            <p>lazarm: Hello world all to you guys</p>
                        </div>
                    </div>
                    <div className="support-item">
                        <img src={catIcons["pwn"]} />
                        <div className="support-subitem">
                            <h2>Challenge: <strong>Basic Web</strong> <i>#1</i></h2>
                            <p>lazarm: Hello world all to you guys</p>
                        </div>
                    </div>
                    <div className="support-item">
                        <img src={catIcons["pwn"]} />
                        <div className="support-subitem">
                            <h2>Challenge: <strong>Basic Web</strong> <i>#1</i></h2>
                            <p>lazarm: Hello world all to you guys</p>
                        </div>
                    </div>
                    <div className="support-item">
                        <img src={catIcons["pwn"]} />
                        <div className="support-subitem">
                            <h2>Challenge: <strong>Basic Web</strong> <i>#1</i></h2>
                            <p>lazarm: Hello world all to you guys</p>
                        </div>
                    </div>
                    <div className="support-item">
                        <img src={catIcons["pwn"]} />
                        <div className="support-subitem">
                            <h2>Challenge: <strong>Basic Web</strong> <i>#1</i></h2>
                            <p>lazarm: Hello world all to you guys</p>
                        </div>
                    </div>
                    <div className="support-item">
                        <img src={catIcons["pwn"]} />
                        <div className="support-subitem">
                            <h2>Challenge: <strong>Basic Web</strong> <i>#1</i></h2>
                            <p>lazarm: Hello world all to you guys</p>
                        </div>
                    </div>
                    <div className="support-load-more">
                        LOAD MORE
                    </div>
                </div>
            </div>
            <div className="support-right">
                <div className="support-header">
                    <img src={catIcons["pwn"]} />
                    <div className="support-subheader">
                        <Link to="/"><h2>Challenge: <strong>Basic Web</strong> <i>#1</i></h2></Link>
                        <p>{difficulties[0]} - Web Exploitation</p>
                    </div>
                </div>
                <div className="support-info">
                    {isNew ? <FiSend /> : <TbMessages />}
                    <h2>{isNew ? 'Send message to start conversation' : 'Choose conversation from left menu' }</h2>
                </div>
                <div className="support-content">
                    <div className="support-input-con">
                        <AutoGrowTextarea
                            value={msgInput}
                            onChange={e => setMsgInput(e.target.value)}
                            className='support-input'
                            placeholder='Write a message...'
                        />
                        <IoSend />
                    </div>
                    <div className="support-messages">
                        <div className="support-message">
                            <Avatar />
                            <div className="support-message-data">
                                <div className="support-message-sender">
                                    <div className="support-name"><span className="role-moderator"></span>lazarm</div>
                                    <div className="support-date">17/05/2025 12:00:05</div>
                                </div>
                                <div className="support-message-content">Hello World Hello World Hello World Hello World Hello World Hello World Hello World Hello World Hello World Hello World Hello World </div>
                            </div>
                        </div>
                        <div className="support-message support-message-right">
                            <Avatar />
                            <div className="support-message-data">
                                <div className="support-message-sender">
                                    <div className="support-name"><span className="role-moderator"></span>lazarm</div>
                                    <div className="support-date">17/05/2025 12:00:05</div>
                                </div>
                                <div className="support-message-content">Hello World Hello World Hello World Hello World Hello World Hello World Hello World Hello World Hello World Hello World Hello World </div>
                            </div>
                        </div>
                        <div className="support-load-more">
                            LOAD MORE
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Support;