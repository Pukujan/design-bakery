import { motion } from 'motion/react';
import { ArrowLeft, Upload, Calendar, ExternalLink } from 'lucide-react';
import { Button } from './ui/button';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { Card } from './ui/card';
import { Textarea } from './ui/textarea';
import { Input } from './ui/input';
import { useState } from 'react';

interface GalleryItem {
  id: number;
  image: string;
  title: string;
  description: string;
  date: string;
  link?: string;
  comingSoon?: boolean;
}

interface GalleryPageProps {
  title: string;
  description: string;
  color: string;
  items: GalleryItem[];
  onBack: () => void;
  allowUpload?: boolean;
}

export function GalleryPage({ title, description, color, items, onBack, allowUpload = false }: GalleryPageProps) {
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newLink, setNewLink] = useState('');

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-100 to-yellow-100 dark:from-purple-950 dark:via-pink-950 dark:to-yellow-950">
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <Button
            onClick={onBack}
            variant="outline"
            className="mb-6 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Portfolio
          </Button>

          <div className="text-center mb-8">
            <h1 
              className="text-[clamp(3rem,7vw,5rem)] leading-none mb-4 font-black"
              style={{ color }}
            >
              {title}
            </h1>
            <p className="text-2xl opacity-90 text-gray-900 dark:text-gray-100">{description}</p>
          </div>

          {allowUpload && (
            <div className="text-center mb-8">
              <Button
                onClick={() => setShowUploadForm(!showUploadForm)}
                className="bg-black hover:bg-pink-500 text-white border-4 border-black px-8 py-4 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all"
              >
                <Upload className="mr-2 h-5 w-5" />
                Add New Event
              </Button>
            </div>
          )}
        </motion.div>

        {/* Upload Form */}
        {showUploadForm && allowUpload && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mb-12"
          >
            <Card className="p-8 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white dark:bg-gray-900">
              <h3 className="text-2xl mb-6 font-black text-gray-900 dark:text-gray-100">Add New Event</h3>
              <div className="space-y-4">
                <div>
                  <label className="block mb-2 text-gray-900 dark:text-gray-100">Event Title</label>
                  <Input
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="Enter event title..."
                    className="border-4 border-black"
                  />
                </div>
                <div>
                  <label className="block mb-2 text-gray-900 dark:text-gray-100">Image URL (from Imgur, etc.)</label>
                  <Input
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    placeholder="https://i.imgur.com/..."
                    className="border-4 border-black"
                  />
                </div>
                <div>
                  <label className="block mb-2 text-gray-900 dark:text-gray-100">Description</label>
                  <Textarea
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    placeholder="Write about the event..."
                    className="border-4 border-black min-h-[120px]"
                  />
                </div>
                <div>
                  <label className="block mb-2 text-gray-900 dark:text-gray-100">Event Link (optional)</label>
                  <Input
                    value={newLink}
                    onChange={(e) => setNewLink(e.target.value)}
                    placeholder="https://your-event-page.com"
                    className="border-4 border-black"
                  />
                </div>
                <div className="flex gap-4">
                  <Button
                    onClick={() => {
                      // In a real app, this would save to a database
                      const eventData = {
                        title: newTitle,
                        image: newImageUrl,
                        description: newDescription,
                        link: newLink,
                        date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
                      };
                      alert('In a real application, this would save to your database. For now, please manually add it to the component.\n\nEvent Data:\n' + JSON.stringify(eventData, null, 2));
                      setShowUploadForm(false);
                      setNewTitle('');
                      setNewDescription('');
                      setNewImageUrl('');
                      setNewLink('');
                    }}
                    className="bg-green-500 hover:bg-green-600 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                  >
                    Save Event
                  </Button>
                  <Button
                    onClick={() => setShowUploadForm(false)}
                    variant="outline"
                    className="border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Gallery Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {items.map((item, index) => {
            const cardContent = (
              <>
                <div className={`aspect-[4/3] overflow-hidden relative group ${item.comingSoon ? 'blur-sm' : ''}`}>
                  <ImageWithFallback
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                  {item.link && !item.comingSoon && (
                    <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-20 transition-opacity flex items-center justify-center">
                      <ExternalLink className="w-12 h-12 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  )}
                </div>
                <div className={`p-6 ${item.comingSoon ? 'blur-sm' : ''}`} style={{ backgroundColor: color }}>
                  <div className="flex items-center gap-2 mb-2 text-white">
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm">{item.date}</span>
                  </div>
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-xl mb-2 text-white font-black flex-1">{item.title}</h3>
                    {item.link && (
                      <ExternalLink className="w-5 h-5 text-white flex-shrink-0 mt-1" />
                    )}
                  </div>
                  <p className="text-white/90">{item.description}</p>
                  {item.link && (
                    <div className="mt-3">
                      <span className="text-white/80 text-sm italic">Click to view event details →</span>
                    </div>
                  )}
                </div>
              </>
            );

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 30, rotate: -5 }}
                animate={{ opacity: 1, y: 0, rotate: 0 }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                whileHover={!item.comingSoon ? { scale: 1.05, rotate: 2 } : {}}
                className="relative"
              >
                {item.link && !item.comingSoon ? (
                  <a 
                    href={item.link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="block cursor-pointer"
                  >
                    <Card className="overflow-hidden border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-all bg-white dark:bg-gray-900">
                      {cardContent}
                    </Card>
                  </a>
                ) : (
                  <Card className={`overflow-hidden border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all bg-white dark:bg-gray-900 ${item.comingSoon ? 'pointer-events-none' : ''}`}>
                    {cardContent}
                  </Card>
                )}
                
                {/* Coming Soon Overlay */}
                {item.comingSoon && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 + 0.3, duration: 0.5 }}
                    className="absolute inset-0 flex items-center justify-center pointer-events-none"
                  >
                    <div className="bg-gradient-to-br from-pink-500 via-purple-500 to-blue-500 px-8 py-6 rounded-2xl border-6 border-black shadow-[10px_10px_0px_0px_rgba(0,0,0,1)]">
                      <motion.h3 
                        className="text-[clamp(2rem,5vw,3rem)] leading-none font-black text-white text-center"
                        animate={{ 
                          scale: [1, 1.05, 1],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      >
                        COMING<br />SOON
                      </motion.h3>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>

        {items.length === 0 && (
          <div className="text-center py-20">
            <p className="text-2xl opacity-60 text-gray-900 dark:text-gray-100">No events yet. Upload your first one!</p>
          </div>
        )}
      </div>
    </div>
  );
}
