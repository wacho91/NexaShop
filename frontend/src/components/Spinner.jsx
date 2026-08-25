export default function Spinner() {
  // Array para simular 8 tarjetas de productos cargando
  const skeletonItems = [...Array(8)];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 py-8">
      {skeletonItems.map((_, index) => (
        <div 
          key={index} 
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden animate-pulse"
        >
          {/* Imagen fantasma */}
          <div className="h-56 bg-gray-200 dark:bg-gray-700"></div>
          
          {/* Detalles fantasma */}
          <div className="p-5 flex flex-col gap-3">
            {/* Título */}
            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
            {/* Stock */}
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            
            {/* Precio y Botón */}
            <div className="flex items-end justify-between mt-4">
              <div className="flex flex-col gap-2 w-full">
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              </div>
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-1/4"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}