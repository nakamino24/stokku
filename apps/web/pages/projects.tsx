import { useState } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import { FiPlus, FiTrash2 } from 'react-icons/fi';

// Fetcher function with token
const fetcher = (url: string) => {
  const token = localStorage.getItem('token');
  return fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }).then(async (res) => {
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to fetch');
    }
    return res.json();
  });
};

export default function ProjectsPage() {
  const { data, error, isLoading, mutate } = useSWR(
    `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/projects`,
    fetcher
  );

  const [deletingId, setDeletingId] = useState<string | null>(null);

  if (error) return <div>Failed to load projects</div>;
  if (isLoading) return <div>Loading...</div>;

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const token = localStorage.getItem('token');
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/projects/${id}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      // Optimistically update the cache
      mutate((prev: any) => {
        if (!prev) return prev;
        return {
          ...prev,
          projects: (prev.projects || []).filter((p: any) => p.id !== id),
        };
      }, false);
    } catch (err) {
      console.error('Delete error:', err);
      setDeletingId(null);
      alert('Failed to delete project');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Projects</h1>
        <Link href="/projects/create" className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
          <FiPlus className="mr-2" /> New Project
        </Link>
      </div>

      {data?.projects && data.projects.length > 0 ? (
        <div className="space-y-4">
          {data.projects.map((project: any) => (
            <div key={project.id} className="border rounded-lg p-4 bg-white shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="font-semibold text-lg">{project.name}</h2>
                  {project.description && (
                    <p className="text-gray-600 mt-1 line-clamp-2">{project.description}</p>
                  )}
                  <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                    <span>
                      <i className="fas fa-calendar"></i> {new Date(project.createdAt).toLocaleDateString()}
                    </span>
                    <span>Status: {project.status}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Link href={`/projects/${project.id}`} className="text-indigo-600 hover:text-indigo-500">
                    View
                  </Link>
                  {deletingId === project.id ? (
                    <button
                      disabled
                      className="px-3 py-1 bg-gray-300 text-gray-500 rounded-md"
                    >
                      Deleting...
                    </button>
                  ) : (
                    <button
                      onClick={() => handleDelete(project.id)}
                      className="px-3 py-1 bg-red-100 text-red-600 rounded-md hover:bg-red-200"
                    >
                      <FiTrash2 className="mr-1" /> Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500">No projects yet. Create your first project!</p>
      )}
    </div>
  );
}