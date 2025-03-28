const MessageSkeleton = () => {
  return (
    <>
      {[1, 2, 3].map((_, idx) => (
        <div key={idx} className={`flex items-start gap-2.5 ${idx % 2 === 0 ? '' : 'flex-row-reverse'}`}>
          <div className="skeleton w-10 h-10 rounded-full shrink-0" />
          
          <div className={`flex flex-col gap-1 ${idx % 2 === 0 ? 'items-start' : 'items-end'}`}>
            <div className="skeleton h-4 w-24" />
            <div className={`skeleton h-16 ${idx % 2 === 0 ? 'w-[250px]' : 'w-[200px]'}`} />
          </div>
        </div>
      ))}
    </>
  );
};

export default MessageSkeleton;
