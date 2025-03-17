import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Heart, 
  Eye, 
  Repeat,
  MessageSquare,
  CheckCircle,
  Move,
  FileText,
  Target,
  Music,
  Zap,
  Trash2,
  AlertCircle
} from 'lucide-react';
import { MoveDialog } from './MoveDialog';
import { knowledgeApi, KnowledgeItem } from '../services/api';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config/api';

interface ReelComment {
  text: string;
  ownerUsername: string;
  timestamp: string;
  repliesCount: number;
  replies: ReelComment[];
  likesCount: number;
}

interface Reel {
  inputUrl?: string;
  caption: string;
  transcription: string;
  keyPoint?: string;
  keyMessage?: string;
  trigger?: string;
  hashtags: string[];
  mentions: string[];
  url: string;
  commentsCount: number;
  latestComments?: ReelComment[];
  comments?: ReelComment[];
  videoUrl: string;
  likesCount: number;
  videoViewCount: number;
  videoPlayCount: number;
  timestamp: string;
  ownerFullName: string;
  ownerUsername: string;
  ownerId: string;
  productType: string;
  videoDuration: number;
  isSponsored: boolean;
  musicInfo: {
    artist_name?: string;
    song_name?: string;
    artistName?: string;
    songName?: string;
    usesOriginalAudio?: boolean;
    shouldMuteAudio?: boolean;
    shouldMuteAudioReason?: string;
    audioId?: string;
  };
}

interface ReelsListProps {
  reels: Reel[];
  sourceId?: string | null;
  onReelsDeleted?: () => void;
}

interface DeleteDialogProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title: string;
  message: string;
}

function DeleteDialog({ isOpen, onConfirm, onCancel, title, message }: DeleteDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-sm w-full mx-4"
      >
        <div className="flex items-center mb-4 text-red-500">
          <AlertCircle className="w-6 h-6 mr-2" />
          <h3 className="text-lg font-semibold">{title}</h3>
        </div>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          {message}
        </p>
        <div className="flex justify-end space-x-4">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            Отмена
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Удалить
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export function ReelsList({ reels, sourceId, onReelsDeleted }: ReelsListProps) {
  const { showSuccess, showError } = useToast();
  const { token } = useAuth();
  const [expandedComments, setExpandedComments] = useState<{ [key: string]: boolean }>({});
  const [expandedVideos, setExpandedVideos] = useState<{ [key: string]: boolean }>({});
  const [selectedReels, setSelectedReels] = useState<string[]>([]);
  const [showMoveDialog, setShowMoveDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [items, setItems] = useState<KnowledgeItem[]>([]);
  const [normalizedReels, setNormalizedReels] = useState<Reel[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    loadItems();
    normalizeReelsData();
  }, [reels]);

  const loadItems = async () => {
    try {
      const data = await knowledgeApi.getItems();
      setItems(data);
    } catch (error) {
      console.error('Error loading items:', error);
    }
  };

  const normalizeReelsData = () => {
    try {
      if (!reels || !Array.isArray(reels)) {
        setNormalizedReels([]);
        return;
      }

      const validReels = reels.filter(reel => 
        reel && 
        typeof reel === 'object' && 
        (reel.url || reel.Url) && 
        (reel.caption || reel.Caption) && 
        (reel.transcription || reel.Transcription)
      ).map(reel => ({
        inputUrl: reel.inputUrl || reel.InputUrl || '',
        caption: reel.caption || reel.Caption || '',
        transcription: reel.transcription || reel.Transcription || '',
        keyPoint: reel.keyPoint || reel.KeyPoint || reel.keyMessage || reel.KeyMessage || '',
        keyMessage: reel.keyMessage || reel.KeyMessage || reel.keyPoint || reel.KeyPoint || '',
        trigger: reel.trigger || reel.Trigger || '',
        hashtags: Array.isArray(reel.hashtags || reel.Hashtags) ? [...(reel.hashtags || reel.Hashtags)] : [],
        mentions: Array.isArray(reel.mentions || reel.Mentions) ? [...(reel.mentions || reel.Mentions)] : [],
        url: reel.url || reel.Url || '',
        commentsCount: reel.commentsCount || reel.CommentsCount || 0,
        latestComments: (reel.latestComments || reel.LatestComments || []).map(comment => ({
          text: comment.text || comment.Text || '',
          ownerUsername: comment.ownerUsername || comment.OwnerUsername || '',
          timestamp: comment.timestamp || comment.Timestamp || '',
          repliesCount: comment.repliesCount || comment.RepliesCount || 0,
          likesCount: comment.likesCount || comment.LikesCount || 0,
          replies: []
        })),
        videoUrl: reel.videoUrl || reel.VideoUrl || '',
        likesCount: reel.likesCount || reel.LikesCount || 0,
        videoViewCount: reel.videoViewCount || reel.VideoViewCount || 0,
        videoPlayCount: reel.videoPlayCount || reel.VideoPlayCount || 0,
        timestamp: reel.timestamp || reel.Timestamp || '',
        ownerFullName: reel.ownerFullName || reel.OwnerFullName || '',
        ownerUsername: reel.ownerUsername || reel.OwnerUsername || '',
        ownerId: reel.ownerId || reel.OwnerId || '',
        productType: reel.productType || reel.ProductType || '',
        videoDuration: reel.videoDuration || reel.VideoDuration || 0,
        isSponsored: Boolean(reel.isSponsored || reel.IsSponsored),
        musicInfo: {
          artist_name: reel.musicInfo?.artist_name || reel.musicInfo?.artistName || reel.MusicInfo?.ArtistName || reel.MusicInfo?.artist_name || '',
          song_name: reel.musicInfo?.song_name || reel.musicInfo?.songName || reel.MusicInfo?.SongName || reel.MusicInfo?.song_name || '',
          usesOriginalAudio: Boolean(reel.musicInfo?.usesOriginalAudio || reel.MusicInfo?.UsesOriginalAudio),
          shouldMuteAudio: Boolean(reel.musicInfo?.shouldMuteAudio || reel.MusicInfo?.ShouldMuteAudio),
          shouldMuteAudioReason: reel.musicInfo?.shouldMuteAudioReason || reel.MusicInfo?.ShouldMuteAudioReason || '',
          audioId: reel.musicInfo?.audioId || reel.MusicInfo?.AudioId || ''
        }
      }));

      setNormalizedReels(validReels);
    } catch (error) {
      console.error('Error normalizing reels data:', error);
      setNormalizedReels([]);
    }
  };

  const toggleComments = (reelUrl: string) => {
    setExpandedComments(prev => ({
      ...prev,
      [reelUrl]: !prev[reelUrl]
    }));
  };

  const toggleVideo = (reelUrl: string) => {
    setExpandedVideos(prev => ({
      ...prev,
      [reelUrl]: !prev[reelUrl]
    }));
  };

  const toggleReelSelection = (reelUrl: string) => {
    setSelectedReels(prev => {
      if (prev.includes(reelUrl)) {
        return prev.filter(url => url !== reelUrl);
      }
      return [...prev, reelUrl];
    });
  };

  const handleMove = async (targetFolderId: string | null, newFileName?: string) => {
    if (isProcessing || !token) {
      showError('Необходима авторизация');
      return;
    }

    setIsProcessing(true);

    try {
      const selectedReelsData = normalizedReels.filter(reel => selectedReels.includes(reel.url));
      
      const targetItem = items.find(item => item.id === targetFolderId);
      if (targetItem && targetItem.type === 'file' && targetItem.fileType === 'reels') {
        const response = await fetch(`${API_URL}/reels/move-item`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            sourceReelsId: sourceId,
            targetReelsId: targetItem.id,
            reelsItemId: selectedReels
          })
        });

        if (!response.ok) {
          throw new Error(`Ошибка при перемещении: ${response.status}`);
        }
        
        showSuccess('Reels успешно добавлены в существующую статью');
      } else {
        const newFile: KnowledgeItem = {
          type: 'file',
          fileType: 'reels',
          name: newFileName || `Reels (${selectedReelsData.length})`,
          content: JSON.stringify([]),
          parentId: targetFolderId
        };

        const savedFile = await knowledgeApi.createFile(newFile);
        
        const response = await fetch(`${API_URL}/reels/move-item`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            sourceReelsId: sourceId,
            targetReelsId: savedFile.id,
            reelsItemId: selectedReels
          })
        });

        if (!response.ok) {
          throw new Error(`Ошибка при перемещении: ${response.status}`);
        }

        showSuccess('Новая статья с Reels успешно создана');
      }
      
      await loadItems();
      
      setShowMoveDialog(false);
      setSelectedReels([]);
    } catch (error) {
      console.error('Failed to move reels:', error);
      showError('Ошибка при перемещении Reels. Пожалуйста, попробуйте еще раз.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async () => {
    if (!token || !sourceId) {
      showError('Необходима авторизация');
      return;
    }

    setIsProcessing(true);

    try {
      const response = await fetch(`${API_URL}/reels/remove-item`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          reelsId: sourceId,
          reelsItemId: selectedReels
        })
      });

      if (!response.ok) {
        throw new Error(`Ошибка при удалении: ${response.status}`);
      }

      showSuccess('Reels успешно удалены');
      setSelectedReels([]);
      setShowDeleteDialog(false);
      
      // Обновляем список рилсов
      if (onReelsDeleted) {
        onReelsDeleted();
      }
    } catch (error) {
      console.error('Failed to delete reels:', error);
      showError('Ошибка при удалении Reels. Пожалуйста, попробуйте еще раз.');
    } finally {
      setIsProcessing(false);
    }
  };

  const formatNumber = (num: number | undefined | null): string => {
    if (num === undefined || num === null) return '0';
    return num.toLocaleString('ru-RU') || '0';
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Некорректная дата';
    }
  };

  if (normalizedReels.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500 dark:text-gray-400">Нет данных для отображения</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-20">
        {normalizedReels.map((reel, index) => (
          <div
            key={index}
            className={`bg-white dark:bg-gray-800 rounded-xl overflow-hidden relative ${
              selectedReels.includes(reel.url) ? 'ring-2 ring-blue-500' : ''
            }`}
          >
            <button
              onClick={() => toggleReelSelection(reel.url)}
              className={`absolute top-2 right-2 p-2 rounded-full transition-colors ${
                selectedReels.includes(reel.url)
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
              }`}
            >
              <CheckCircle className="w-4 h-4" />
            </button>

            <div className="p-4">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 mr-3 flex items-center justify-center overflow-hidden">
                  <span className="text-gray-500 dark:text-gray-400 font-bold">
                    {reel.ownerUsername?.charAt(0).toUpperCase() || 'A'}
                  </span>
                </div>
                <div>
                  <a
                    href={reel.inputUrl || reel.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-gray-900 dark:text-white hover:underline"
                  >
                    {reel.ownerFullName || 'Автор'}
                  </a>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    @{reel.ownerUsername || 'username'}
                  </div>
                </div>
              </div>

              <div className="w-full max-w-[240px] mx-auto">
                <button
                  onClick={() => toggleVideo(reel.url)}
                  className="w-full p-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                >
                  {expandedVideos[reel.url] ? 'Скрыть видео' : 'Показать видео'}
                </button>
                
                <AnimatePresence>
                  {expandedVideos[reel.url] && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="mt-2"
                    >
                      <div className="aspect-[9/16] relative">
                        <video
                          src={reel.videoUrl}
                          controls
                          playsInline
                          preload="metadata"
                          className="absolute inset-0 w-full h-full object-contain bg-black rounded-lg"
                          onError={(e) => {
                            console.error('Error loading video:', e);
                            const target = e.target as HTMLVideoElement;
                            target.insertAdjacentHTML(
                              'afterend',
                              '<div class="absolute inset-0 flex items-center justify-center bg-gray-900 text-white text-sm rounded-lg">Ошибка загрузки видео</div>'
                            );
                          }}
                        >
                          Ваш браузер не поддерживает видео.
                        </video>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="mt-4 grid grid-cols-4 gap-4 text-center text-sm">
                <div>
                  <div className="font-semibold text-gray-900 dark:text-white flex items-center justify-center gap-1">
                    <Heart className="w-4 h-4 text-red-500" />
                    {formatNumber(reel.likesCount)}
                  </div>
                </div>
                <div>
                  <div className="font-semibold text-gray-900 dark:text-white flex items-center justify-center gap-1">
                    <Eye className="w-4 h-4 text-blue-500" />
                    {formatNumber(reel.videoViewCount)}
                  </div>
                </div>
                <div>
                  <div className="font-semibold text-gray-900 dark:text-white flex items-center justify-center gap-1">
                    <Repeat className="w-4 h-4 text-green-500" />
                    {formatNumber(reel.videoPlayCount)}
                  </div>
                </div>
                <div>
                  <div className="font-semibold text-gray-900 dark:text-white flex items-center justify-center gap-1">
                    <MessageSquare className="w-4 h-4 text-purple-500" />
                    {formatNumber(reel.commentsCount)}
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <div className="text-sm text-gray-900 dark:text-white">
                  {reel.caption}
                </div>
                <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  {formatDate(reel.timestamp)}
                </div>
              </div>

              {reel.musicInfo && (
                <div className="mt-4 text-sm">
                  <div className="flex items-center">
                    <Music className="w-4 h-4 text-pink-500 dark:text-pink-400 mr-2" />
                    <div className="font-medium text-gray-900 dark:text-white">
                      {reel.musicInfo.song_name || reel.musicInfo.songName}
                    </div>
                  </div>
                  <div className="ml-6 text-gray-500 dark:text-gray-400">
                    {reel.musicInfo.artist_name || reel.musicInfo.artistName}
                  </div>
                </div>
              )}

              {((reel.latestComments && reel.latestComments.length > 0) || (reel.comments && reel.comments.length > 0)) && (
                <div className="mt-4">
                  <button
                    onClick={() => toggleComments(reel.url)}
                    className="flex items-center text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                  >
                    <MessageSquare className="w-4 h-4 mr-1" />
                    Комментарии ({formatNumber(reel.commentsCount)})
                  </button>
                  
                  <AnimatePresence>
                    {expandedComments[reel.url] && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="mt-2 space-y-2 overflow-hidden"
                      >
                        {(reel.latestComments || reel.comments || []).map((comment, i) => (
                          <div key={i} className="text-sm">
                            <span className="font-medium text-gray-900 dark:text-white">
                              {comment.ownerUsername}
                            </span>
                            <span className="ml-2 text-gray-700 dark:text-gray-300">
                              {comment.text}
                            </span>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {formatDate(comment.timestamp)}
                            </div>
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              <div className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-4">
                <div className="flex items-center mb-1">
                  <Zap className="w-3 h-3 mr-1 text-blue-500 dark:text-blue-400" />
                  <span className="text-xs font-medium text-blue-500 dark:text-blue-400">Ключевой посыл:</span>
                </div>
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  {reel.keyPoint || reel.keyMessage || "Не указан"}
                </div>
              </div>

              {reel.trigger && (
                <div className="mt-3">
                  <div className="flex items-center mb-1">
                    <Target className="w-3 h-3 mr-1 text-amber-500 dark:text-amber-400" />
                    <span className="text-xs font-medium text-amber-500 dark:text-amber-400">Триггер:</span>
                  </div>
                  <div className="text-sm text-gray-700 dark:text-gray-300">
                    {reel.trigger}
                  </div>
                </div>
              )}
              
              <div className="mt-3">
                <div className="flex items-center mb-1">
                  <FileText className="w-3 h-3 mr-1 text-purple-500 dark:text-purple-400" />
                  <span className="text-xs font-medium text-purple-500 dark:text-purple-400">Транскрипция:</span>
                </div>
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  {reel.transcription}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedReels.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-t-xl px-6 py-4 flex items-center gap-4">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
              Выбрано: {selectedReels.length}
            </span>
            <button
              onClick={() => setShowMoveDialog(true)}
              disabled={isProcessing || !token}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Move className="w-4 h-4 mr-2" />
              {!token ? 'Требуется авторизация' : (isProcessing ? 'Обработка...' : 'Переместить')}
            </button>
            {sourceId && (
              <button
                onClick={() => setShowDeleteDialog(true)}
                disabled={isProcessing || !token}
                className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {!token ? 'Требуется авторизация' : (isProcessing ? 'Обработка...' : 'Удалить')}
              </button>
            )}
          </div>
        </div>
      )}

      <MoveDialog
        isOpen={showMoveDialog}
        onClose={() => setShowMoveDialog(false)}
        onMove={handleMove}
        items={items}
        currentItem={{
          id: 'temp',
          type: 'file',
          fileType: 'reels',
          name: 'Новый файл'
        }}
      />

      <DeleteDialog
        isOpen={showDeleteDialog}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteDialog(false)}
        title="Подтверждение удаления"
        message={`Вы уверены, что хотите удалить выбранные Reels (${selectedReels.length} шт.)?`}
      />
    </>
  );
}
