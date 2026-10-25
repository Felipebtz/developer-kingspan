import Link from 'next/link';

export default function Home() {
  return (
    <div>
      <Link className='p-6 m-5 text-blue-600 ' href="/dashboard">
        Ir para Dashboard
      </Link>
    </div>
  );
}