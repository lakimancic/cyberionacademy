type ImageWrapperProps = React.ImgHTMLAttributes<HTMLImageElement>;

const ImageWrapper: React.FC<ImageWrapperProps> = ({ src, alt = '', ...props }) => {
    return <img src={src===""?undefined:src} alt={alt} {...props} />;
};

export default ImageWrapper;