import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHouse } from "@fortawesome/free-solid-svg-icons";

export default function NotFound() {
  return (
    <div className="container mx-auto flex min-h-[65vh] flex-col items-center justify-center px-4 text-center">
      <h2 className="text-7xl sm:text-9xl font-black text-secondary tracking-tight drop-shadow-sm">
        404
      </h2>
      <p className="mt-4 text-2xl font-bold text-foreground">
        Không tìm thấy trang yêu cầu
      </p>
      <p className="mt-2 text-sm text-muted-foreground max-w-sm">
        Trang bạn đang tìm kiếm không tồn tại hoặc đã được di chuyển.
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-lg hover:brightness-105 transition-all"
      >
        <FontAwesomeIcon icon={faHouse} className="text-xs" />
        <span>Trở về Trang Chủ</span>
      </Link>
    </div>
  );
}
