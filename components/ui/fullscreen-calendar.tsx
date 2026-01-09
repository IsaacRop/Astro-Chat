"use client";

import * as React from "react";
import {
    add,
    eachDayOfInterval,
    endOfMonth,
    endOfWeek,
    format,
    getDay,
    isEqual,
    isSameDay,
    isSameMonth,
    isToday,
    parse,
    startOfToday,
    startOfWeek,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import {
    ChevronLeftIcon,
    ChevronRightIcon,
    PlusCircleIcon,
    CheckSquare,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useMediaQuery } from "@/hooks/use-media-query";

export interface CalendarEvent {
    id: string;
    name: string;
    time?: string;
    datetime: string;
    type: "event" | "task";
    status?: string;
}

export interface CalendarData {
    day: Date;
    events: CalendarEvent[];
}

interface FullScreenCalendarProps {
    data: CalendarData[];
    onAddEvent?: (date: Date) => void;
    onEventClick?: (event: CalendarEvent) => void;
}

const colStartClasses = [
    "",
    "col-start-2",
    "col-start-3",
    "col-start-4",
    "col-start-5",
    "col-start-6",
    "col-start-7",
];

const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export function FullScreenCalendar({
    data,
    onAddEvent,
    onEventClick,
}: FullScreenCalendarProps) {
    const today = startOfToday();
    const [selectedDay, setSelectedDay] = React.useState(today);
    const [currentMonth, setCurrentMonth] = React.useState(
        format(today, "MMM-yyyy")
    );
    const firstDayCurrentMonth = parse(currentMonth, "MMM-yyyy", new Date());
    const isDesktop = useMediaQuery("(min-width: 768px)");

    const days = eachDayOfInterval({
        start: startOfWeek(firstDayCurrentMonth),
        end: endOfWeek(endOfMonth(firstDayCurrentMonth)),
    });

    function previousMonth() {
        const firstDayNextMonth = add(firstDayCurrentMonth, { months: -1 });
        setCurrentMonth(format(firstDayNextMonth, "MMM-yyyy"));
    }

    function nextMonth() {
        const firstDayNextMonth = add(firstDayCurrentMonth, { months: 1 });
        setCurrentMonth(format(firstDayNextMonth, "MMM-yyyy"));
    }

    function goToToday() {
        setCurrentMonth(format(today, "MMM-yyyy"));
        setSelectedDay(today);
    }

    const getEventsForDay = (day: Date) => {
        return data.filter((d) => isSameDay(d.day, day)).flatMap((d) => d.events);
    };

    return (
        <div className="flex flex-1 flex-col h-full bg-[#0C0C0D]">
            {/* Calendar Header */}
            <div className="flex flex-col space-y-4 p-4 md:flex-row md:items-center md:justify-between md:space-y-0 lg:flex-none border-b border-white/[0.05]">
                <div className="flex flex-auto">
                    <div className="flex items-center gap-6">
                        <div className="hidden w-16 flex-col items-center justify-center rounded-xl border border-white/[0.05] bg-[#1A1A1C] p-1 md:flex">
                            <h1 className="text-[10px] uppercase text-zinc-500 font-medium tracking-widest">
                                {format(today, "MMM", { locale: ptBR })}
                            </h1>
                            <div className="flex w-full items-center justify-center rounded-lg bg-[#0C0C0D] p-1 text-lg font-serif font-medium text-zinc-200">
                                <span>{format(today, "d")}</span>
                            </div>
                        </div>
                        <div className="flex flex-col">
                            <h2 className="text-2xl font-serif font-medium text-zinc-100 capitalize tracking-tight">
                                {format(firstDayCurrentMonth, "MMMM yyyy", { locale: ptBR })}
                            </h2>
                            <p className="text-sm text-zinc-500 font-sans">
                                {format(firstDayCurrentMonth, "d MMM", { locale: ptBR })} -{" "}
                                {format(endOfMonth(firstDayCurrentMonth), "d MMM yyyy", {
                                    locale: ptBR,
                                })}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col items-center gap-4 md:flex-row md:gap-4">
                    <div className="inline-flex w-full -space-x-px rounded-lg shadow-sm md:w-auto">
                        <Button
                            onClick={previousMonth}
                            className="rounded-none shadow-none first:rounded-l-xl last:rounded-r-xl border-white/[0.05] bg-[#1A1A1C] text-zinc-400 hover:bg-white/[0.05] hover:text-zinc-200"
                            variant="outline"
                            size="icon"
                            aria-label="Mês anterior"
                        >
                            <ChevronLeftIcon size={16} strokeWidth={1.5} />
                        </Button>
                        <Button
                            onClick={goToToday}
                            className="w-full rounded-none shadow-none first:rounded-l-xl last:rounded-r-xl border-white/[0.05] bg-[#1A1A1C] text-zinc-400 hover:bg-white/[0.05] hover:text-zinc-200 md:w-auto px-6 font-sans"
                            variant="outline"
                        >
                            Hoje
                        </Button>
                        <Button
                            onClick={nextMonth}
                            className="rounded-none shadow-none first:rounded-l-xl last:rounded-r-xl border-white/[0.05] bg-[#1A1A1C] text-zinc-400 hover:bg-white/[0.05] hover:text-zinc-200"
                            variant="outline"
                            size="icon"
                            aria-label="Próximo mês"
                        >
                            <ChevronRightIcon size={16} strokeWidth={1.5} />
                        </Button>
                    </div>

                    <Separator orientation="vertical" className="hidden h-6 md:block bg-zinc-800" />

                    {onAddEvent && (
                        <Button
                            onClick={() => onAddEvent(selectedDay)}
                            className="w-full gap-2 md:w-auto bg-zinc-100 text-zinc-900 hover:bg-white border border-transparent rounded-xl px-4 py-2"
                        >
                            <PlusCircleIcon size={16} strokeWidth={1.5} />
                            <span>Novo Evento</span>
                        </Button>
                    )}
                </div>
            </div>

            {/* Calendar Grid */}
            <div className="flex flex-1 flex-col overflow-hidden bg-[#0C0C0D]">
                {/* Week Days Header */}
                <div className="grid grid-cols-7 border-b border-white/[0.05] text-center text-[10px] font-medium uppercase tracking-widest leading-6 text-zinc-500">
                    {weekDays.map((day, idx) => (
                        <div
                            key={day}
                            className={cn("py-3", idx < 6 && "border-r border-white/[0.05]")}
                        >
                            {day}
                        </div>
                    ))}
                </div>

                {/* Calendar Days */}
                <div className="flex flex-1 text-xs leading-6 overflow-auto">
                    {/* Desktop Grid */}
                    <div className="hidden w-full md:grid md:grid-cols-7 md:auto-rows-fr border-l border-white/[0.05]">
                        {days.map((day, dayIdx) => {
                            const dayEvents = getEventsForDay(day);
                            const isSelected = isEqual(day, selectedDay);
                            const isCurrentMonth = isSameMonth(day, firstDayCurrentMonth);

                            return (
                                <div
                                    key={dayIdx}
                                    onClick={() => setSelectedDay(day)}
                                    className={cn(
                                        dayIdx === 0 && colStartClasses[getDay(day)],
                                        !isCurrentMonth && "bg-[#09090A] text-zinc-700",
                                        "relative flex flex-col border-b border-r border-white/[0.05] cursor-pointer transition-colors min-h-[100px]",
                                        !isSelected && isCurrentMonth && "hover:bg-white/[0.02]",
                                        isSelected && "bg-[#1A1A1C]"
                                    )}
                                >
                                    <header className="flex items-center justify-between p-3">
                                        <button
                                            type="button"
                                            className={cn(
                                                "flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium transition-all font-serif",
                                                isToday(day) &&
                                                "bg-zinc-100 text-zinc-900 shadow-sm",
                                                isSelected &&
                                                !isToday(day) &&
                                                "bg-zinc-800 text-zinc-200",
                                                !isSelected &&
                                                !isToday(day) &&
                                                "text-zinc-400 group-hover:text-zinc-200"
                                            )}
                                        >
                                            <time dateTime={format(day, "yyyy-MM-dd")}>
                                                {format(day, "d")}
                                            </time>
                                        </button>
                                    </header>

                                    {/* Events */}
                                    <div className="flex-1 px-2 pb-2 space-y-1.5 overflow-hidden">
                                        {dayEvents.slice(0, 3).map((event) => (
                                            <div
                                                key={event.id}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onEventClick?.(event);
                                                }}
                                                className={cn(
                                                    "flex items-center gap-1.5 rounded-md px-2 py-1.5 text-[10px] leading-tight truncate cursor-pointer transition-all border",
                                                    event.type === "task"
                                                        ? "bg-emerald-500/5 text-emerald-400 border-emerald-500/10 hover:bg-emerald-500/10 hover:border-emerald-500/20"
                                                        : "bg-blue-500/5 text-blue-400 border-blue-500/10 hover:bg-blue-500/10 hover:border-blue-500/20"
                                                )}
                                            >
                                                {event.type === "task" && (
                                                    <CheckSquare size={10} className="flex-shrink-0 opacity-70" strokeWidth={1.5} />
                                                )}
                                                <span className="truncate font-medium font-sans opacity-90">
                                                    {event.name}
                                                </span>
                                            </div>
                                        ))}
                                        {dayEvents.length > 3 && (
                                            <div className="text-[10px] text-zinc-600 pl-2 font-medium">
                                                + {dayEvents.length - 3} mais
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Mobile Grid */}
                    <div className="grid w-full grid-cols-7 auto-rows-fr border-l border-white/[0.05] md:hidden bg-[#0C0C0D]">
                        {days.map((day, dayIdx) => {
                            const dayEvents = getEventsForDay(day);
                            const isSelected = isEqual(day, selectedDay);
                            const isCurrentMonth = isSameMonth(day, firstDayCurrentMonth);

                            return (
                                <button
                                    onClick={() => setSelectedDay(day)}
                                    key={dayIdx}
                                    type="button"
                                    className={cn(
                                        !isCurrentMonth && "text-zinc-700 bg-black/20",
                                        "flex h-16 flex-col items-center border-b border-r border-white/[0.05] px-1 py-1.5 focus:z-10 relative",
                                        isSelected ? "bg-[#1A1A1C]" : "bg-transparent"
                                    )}
                                >
                                    <time
                                        dateTime={format(day, "yyyy-MM-dd")}
                                        className={cn(
                                            "flex h-6 w-6 items-center justify-center rounded-full text-xs font-serif transition-colors",
                                            isToday(day) && "bg-zinc-100 text-zinc-900 font-medium",
                                            isSelected && !isToday(day) && "bg-zinc-800 text-zinc-200",
                                            !isToday(day) && !isSelected && "text-zinc-400"
                                        )}
                                    >
                                        {format(day, "d")}
                                    </time>

                                    <div className="mt-auto flex flex-wrap justify-center gap-1 w-full px-1">
                                        {dayEvents.slice(0, 3).map((event) => (
                                            <span
                                                key={event.id}
                                                className={cn(
                                                    "h-1 w-1 rounded-full",
                                                    event.type === "task"
                                                        ? "bg-emerald-500"
                                                        : "bg-blue-500"
                                                )}
                                            />
                                        ))}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Selected Day Details (Mobile) */}
                <div className="md:hidden border-t border-white/[0.05] p-5 bg-[#1A1A1C]">
                    <h3 className="font-serif text-lg text-zinc-100 mb-4 capitalize font-medium">
                        {format(selectedDay, "EEEE, d 'de' MMMM", { locale: ptBR })}
                    </h3>
                    <div className="space-y-3">
                        {getEventsForDay(selectedDay).length === 0 ? (
                            <p className="text-sm text-zinc-500 font-sans italic">
                                Nenhum evento para este dia
                            </p>
                        ) : (
                            getEventsForDay(selectedDay).map((event) => (
                                <div
                                    key={event.id}
                                    onClick={() => onEventClick?.(event)}
                                    className={cn(
                                        "flex items-center gap-3 rounded-xl px-4 py-3 text-sm cursor-pointer border transition-colors",
                                        event.type === "task"
                                            ? "bg-emerald-500/5 text-emerald-400 border-emerald-500/10"
                                            : "bg-blue-500/5 text-blue-400 border-blue-500/10"
                                    )}
                                >
                                    {event.type === "task" && (
                                        <CheckSquare size={16} className="opacity-80" strokeWidth={1.5} />
                                    )}
                                    <div className="flex-1">
                                        <p className="font-medium font-sans">{event.name}</p>
                                        {event.time && (
                                            <p className="text-xs text-zinc-500 mt-0.5">
                                                {event.time}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default FullScreenCalendar;
