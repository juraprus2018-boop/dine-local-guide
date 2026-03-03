interface Stay22WidgetProps {
  latitude: number;
  longitude: number;
  className?: string;
}

export function Stay22Widget({ latitude, longitude, className }: Stay22WidgetProps) {
  const src = `https://www.stay22.com/embed/gm?aid=happio&lat=${latitude}&lng=${longitude}`;

  return (
    <div className={className}>
      <iframe
        id="stay22-widget"
        width="100%"
        height="450"
        frameBorder="0"
        src={src}
        title="Hotels in de buurt"
        loading="lazy"
      />
    </div>
  );
}
