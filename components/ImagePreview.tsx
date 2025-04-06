import React from 'react';
import { View, Image, TouchableOpacity } from 'react-native';
import { Text } from '~/components/ui/text';
import { Button } from '~/components/ui/button';
import { X, Check } from 'lucide-react-native';
import { PhotoType } from '~/types';

interface ImagePreviewProps {
  imageUri: string;
  onAccept: () => void;
  onRetake: () => void;
  photoType: PhotoType;
}

export default function ImagePreview({ 
  imageUri, 
  onAccept, 
  onRetake,
  photoType
}: ImagePreviewProps) {
  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View className="flex-row justify-between items-center p-4">
        <TouchableOpacity 
          onPress={onRetake}
          className="w-10 h-10 rounded-full bg-muted justify-center items-center"
        >
          <X size={24} className="text-foreground" />
        </TouchableOpacity>
        
        <Text className="font-medium text-lg">
          {photoType === 'product' ? 'Product Photo' : 'Expiry Date Photo'}
        </Text>
        
        <TouchableOpacity 
          onPress={onAccept}
          className="w-10 h-10 rounded-full bg-primary justify-center items-center"
        >
          <Check size={24} className="text-primary-foreground" />
        </TouchableOpacity>
      </View>
      
      {/* Image */}
      <View className="flex-1 justify-center items-center p-4">
        <Image 
          source={{ uri: imageUri }} 
          className="w-full h-full rounded-lg"
          resizeMode="contain"
        />
      </View>
      
      {/* Footer */}
      <View className="p-4 flex-row justify-between">
        <Button 
          variant="outline" 
          onPress={onRetake}
          className="flex-1 mr-2"
        >
          Retake
        </Button>
        <Button 
          onPress={onAccept}
          className="flex-1 ml-2"
        >
          Use Photo
        </Button>
      </View>
    </View>
  );
}
