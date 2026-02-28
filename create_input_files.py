from utils import create_input_files

if __name__ == '__main__':
    create_input_files(dataset='coco',
                       karpathy_json_path=r'C:\\Users\\Shabnam\\Desktop\\FrameToPhrase\\caption_datasets\\dataset_coco.json',
                       image_folder=r'C:\\Users\\Shabnam\\Desktop\\FrameToPhrase\\Image_datasets',
                       captions_per_image=5,
                       min_word_freq=5,
                       output_folder=r'C:\\Users\\Shabnam\\Desktop\\FrameToPhrase\\output',
                       max_len=50)